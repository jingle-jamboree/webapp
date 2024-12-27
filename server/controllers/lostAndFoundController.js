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
const fallbackTagGeneration = (input) => {
    // Handle both string and object inputs
    const text = typeof input === 'string'
        ? input
        : (input?.name || input?.description || '');

    if (!text || typeof text !== 'string') {
        return [];
    }

    // Combine all text fields
    const details = text.toLowerCase();

    // Rest of the function remains the same
    const tokens = tokenizer.tokenize(details);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

    const tags = [...new Set(tokens)]
        .filter(word =>
            word.length > 2 &&
            !stopWords.has(word) &&
            !/^\d+$/.test(word)
        );

    return tags.slice(0, 5);
};

const generateTitleAndTags = async (item) => {
    const groq = getGroqClient();
    if (!groq) {
        const fallback = {
            title: fallbackTitleGeneration(item) || "Lost Item",
            tags: fallbackTagGeneration(item) || []
        };
        return fallback;
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a helper that generates JSON formatted titles and tags for lost items.
    You must respond with valid JSON in the following format:
    {"title": "3-4 word descriptive title", "tags": ["3-5 relevant tags"]}

    Rules:
    - Title should be clear and concise
    - Tags should be relevant search terms
    - Capitalize first letter of all words
    - Use only information from the description
    - Response must be valid JSON

    Example:
    Input: "black phone found near library"
    Output: {"title": "Black Phone Found", "tags": ["Phone", "Black", "Electronics"]}`
                },
                {
                    role: "user",
                    content: item.name
                }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 1024,
            temperature: 0.7,
            stream: false,
            response_format: { type: "json_object" },
            stop: null
        });

        // Rest of the function remains the same
        const response = JSON.parse(completion.choices[0]?.message?.content);
        let title = response["title"].replace(/['"]/g, "") || fallbackTitleGeneration(item);
        let tags = response["tags"] || fallbackTagGeneration(item);
        title = title.charAt(0).toUpperCase() + title.slice(1);
        tags = tags.map(tag => tag.charAt(0).toUpperCase() + tag.slice(1));
        return { title, tags };
    } catch (error) {
        console.error('Error with Groq API:', error);
        return {
            title: fallbackTitleGeneration(item) || "Lost Item",
            tags: fallbackTagGeneration(item) || []
        };
    }
};

// Helper function for fallback title generation
const fallbackTitleGeneration = (item) => {
    return item.name.split(" ").slice(0, 4).join(" ");
};

/**
 * Retrieves paginated list of lost items
 * Supports cursor-based pagination using lastId
 */
export const getItems = async (req, res) => {
    try {
        const { lastId, limit = 6, query, date } = req.query;
        let mongoQuery = lastId ? { _id: { $lt: lastId } } : {};

        // Add search conditions if query exists
        if (query) {
            const searchRegex = new RegExp(query, 'i');
            mongoQuery.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { whereFound: searchRegex },
                { whereToFind: searchRegex },
                { tags: searchRegex }
            ];
        }

        // Add date filter if specified
        if (date) {
            mongoQuery.whenFound = date;
        }

        const items = await LostAndFound.find(mongoQuery)
            .sort({ _id: -1 })
            .limit(parseInt(limit) + 1)
            .populate('reportedBy', 'name enroll phone'); // Change 'mobile' to 'phone'

        const hasMore = items.length > limit;
        const resultItems = items.slice(0, limit);

        res.json({
            items: resultItems.map(item => ({
                ...item.toObject(),
                reportedBy: item.reportedBy ? {
                    name: item.reportedBy.name,
                    enroll: item.reportedBy.enroll,
                    phone: item.reportedBy.phone  // Change 'mobile' to 'phone'
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
        const { description, includePhone } = req.body;  // Add includePhone to destructuring
        const { title, tags } = await generateTitleAndTags({ name: description });

        const itemData = {
            ...req.body,
            description,
            name: title,
            reportedBy: req.user._id,
            tags: tags
        };

        const newItem = await LostAndFound.create(itemData);
        const populatedItem = await LostAndFound.findById(newItem._id)
            .populate('reportedBy', includePhone ? 'name enroll phone' : 'name enroll'); // Conditionally include phone

        res.status(201).json(populatedItem);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(400).json({ message: error.message });
    }
};
