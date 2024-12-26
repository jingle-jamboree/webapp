import LostAndFound from '../models/lostAndFoundModel.js';
import natural from 'natural';
import Groq from "groq-sdk";

// Initialize Groq lazily when needed
let groqClient = null;
const getGroqClient = () => {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
};

const tokenizer = new natural.WordTokenizer();

// Remove any direct env file loading
// Remove dotenv import and config

/**
 * Generates searchable tags from item details
 * @param {Object} item - Lost item object
 * @returns {string[]} Array of tags
 */
const fallbackTagGeneration = (text) => {
    // Combine all text fields
    const details = text.toLowerCase();

    // Tokenize and filter words
    const tokens = tokenizer.tokenize(details);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

    // Filter unique meaningful words
    const tags = [...new Set(tokens)]
        .filter(word =>
            word.length > 2 &&
            !stopWords.has(word) &&
            !/^\d+$/.test(word)
        );

    return tags.slice(0, 5); // Limit to 5 tags
};

const generateTitleAndTags = async (item) => {
    const groq = getGroqClient();
    if (!groq) {
        console.log('Using fallback title generation (GROQ not available)');
        return {
            title: fallbackTitleGeneration(item),
            tags: fallbackTagGeneration(item)
        };
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `The following description has been offered by a person for an item.
                    Generate a short title for this item and a set of tags. the tags should be more than one and should be describing the object. Use appropriate capitalisation.
                    The output should be in a json format with the following structure: {title:"<title>", tags:["tag1", "tag2", ...]}.
                    Example titles: "Black wallet", "iPhone 12 Pro Max", "Boat Airdopes 155".
                    Example tags: ["wallet", "purse", "black", "leather"], ["phone", "gold", "cracked"], ["TWS", "earbuds"].`,
                },
                {
                    role: "user",
                    content: `${item.name}`, //item.name is the description given by the user.
                }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            response_format: {
                type: "json_object"
            },
            stop: null
        });
        const response = JSON.parse(completion.choices[0]?.message?.content);
        let title = response["title"].replace(/['"]/g, "") || fallbackTitleGeneration(item);
        let tags = response["tags"] || fallbackTagGeneration(item);
        title = title.charAt(0).toUpperCase() + title.slice(1);
        tags = tags.map(tag => tag.charAt(0).toUpperCase() + tag.slice(1));
        return { title, tags };
    } catch (error) {
        console.error('Error with Groq API:', error);
        return {
            title: fallbackTitleGeneration(item),
            tags: fallbackTagGeneration(item)
        };
    }
};

// Helper function for fallback title generation
const fallbackTitleGeneration = (item) => {
    const timeStr = item.whenFoundTime.split(':')[0] > 11 ? 'PM' : 'AM';
    const dateStr = new Date(item.whenFound).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    return `${item.name} - Found at ${item.whereFound} (${dateStr} ${timeStr})`;
};

/**
 * Retrieves paginated list of lost items
 * Supports cursor-based pagination using lastId
 */
export const getItems = async (req, res) => {
    try {
        const { lastId, limit = 6 } = req.query;
        const query = lastId ? { _id: { $lt: lastId } } : {};

        const items = await LostAndFound.find(query)
            .sort({ _id: -1 })
            .limit(parseInt(limit) + 1)
            .populate('reportedBy', 'name enroll'); // Add this line to get user info

        const hasMore = items.length > limit;
        const resultItems = items.slice(0, limit);

        res.json({
            items: resultItems.map(item => ({
                ...item.toObject(),
                reportedBy: item.reportedBy ? {
                    name: item.reportedBy.name,
                    enroll: item.reportedBy.enroll
                } : null
            })),
            lastId: resultItems.length > 0 ? resultItems[resultItems.length - 1]._id : null,
            count: resultItems.length,
            hasMore
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Failed to fetch items' });
    }
};

/**
 * Creates a new lost item entry
 * Automatically generates tags and links to reporting user
 */
export const createItem = async (req, res) => {
    try {
        const { description } = req.body;
        const { title, tags } = await generateTitleAndTags({ name: description }); // Pass description as name for processing

        const itemData = {
            ...req.body,
            description, // Store original description
            name: title, // Store generated title
            reportedBy: req.user._id,
            tags: tags
        };

        const newItem = await LostAndFound.create(itemData);
        const populatedItem = await LostAndFound.findById(newItem._id)
            .populate('reportedBy', 'name');

        res.status(201).json(populatedItem);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(400).json({ message: error.message });
    }
};
