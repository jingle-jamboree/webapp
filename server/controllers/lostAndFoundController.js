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
                    content: `You are a precise item categorization assistant. Your task is to:
1. Generate a clear, concise title (3-6 words) that accurately describes the item
2. Extract relevant tags (3-5 tags) that will help in searching for this item

Rules for title:
- Must be descriptive but concise
- Start with key identifying features (color, brand, type)
- No quotes or special characters
- Always capitalize first letter of each word

Rules for tags:
- Include item type, color, brand if mentioned
- Only use words present in or directly implied by the description
- No made-up or speculative tags
- Keep tags simple and searchable
- Always capitalize first letter of each tag

Format output as valid JSON: {"title": "string", "tags": ["string"]}

Examples:
Input: "Found a black Samsung phone with cracked screen near library"
Output: {"title": "Black Samsung Phone Cracked", "tags": ["Phone", "Samsung", "Black", "Damaged"]}

Input: "Nike sports shoes blue color size 9 found in gym"
Output: {"title": "Blue Nike Sports Shoes", "tags": ["Shoes", "Nike", "Blue", "Sports"]}`
                },
                {
                    role: "user",
                    content: item.name
                }
            ],
            model: "llama-3.1-8b-instant",
            max_tokens: 1024,
            top_p: 1,
            temperature: 0.7, // Add temperature for slightly more controlled output
            stream: false,
            response_format: { type: "json_object" },
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
    return item.name.split(" ").slice(0, 4).join(" ");
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
