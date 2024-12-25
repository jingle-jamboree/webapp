import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB using the provided URI
 * Includes MongoDB recommended configuration options
 * @param {string} uri - MongoDB connection string
 */
export const connectDB = async (uri) => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};
