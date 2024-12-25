import { LostItem } from '../models/LostItem.js';
import path from 'path';

/**
 * Generates searchable tags from item details
 * @param {Object} item - Lost item object
 * @returns {string[]} Array of tags
 */
const generateTags = (item) => {
    const tags = new Set();
    // Add item name words as tags
    item.name.toLowerCase().split(' ').forEach(word => tags.add(word));
    // Add location words as tags
    item.whereFound.toLowerCase().split(' ').forEach(word => tags.add(word));
    return Array.from(tags);
};

/**
 * Retrieves paginated list of lost items
 * Supports cursor-based pagination using lastId
 */
export const getItems = async (req, res) => {
    try {
        const { lastId, limit = 6 } = req.query;
        const query = lastId ? { _id: { $lt: lastId } } : {};

        const items = await LostItem.find(query)
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
        const { name, whereFound, whereToFind, whenFound, whenFoundTime, tags } = req.body;

        const itemData = {
            name,
            whereFound,
            whereToFind,
            whenFound,
            whenFoundTime,
            tags, // Remove JSON.parse since tags is already an array
            reportedBy: req.user._id
        };

        // Add image URL if file was uploaded
        if (req.file) {
            // Create URL-friendly path for the image
            const imagePath = `/uploads/${req.file.filename}`;
            itemData.image = imagePath;
        }

        const newItem = new LostItem(itemData);
        await newItem.save();

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Failed to create item' });
    }
};
