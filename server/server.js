import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lostAndFoundRoutes from './routes/lostAndFoundRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// First try loading development env if exists
let envPath = path.resolve(__dirname, '../.env.development');

try {
    // If development env doesn't exist or we're explicitly in production, try production env
    if (!fs.existsSync(envPath) || process.env.NODE_ENV === 'production') {
        envPath = path.resolve(__dirname, '../.env.production');
    }

    // Load the appropriate env file
    const envResult = dotenv.config({ path: envPath });

    if (envResult.error) {
        throw new Error(`Failed to load environment file: ${envResult.error.message}`);
    }

    // Set NODE_ENV if not already set
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = envPath.includes('production') ? 'production' : 'development';
    }

    // Validate essential environment variables
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

    if (missingEnvVars.length > 0) {
        throw new Error('Missing required environment variables: ' + missingEnvVars.join(', '));
    }

    // Add debug logging
    console.log('Environment setup complete. Available variables:', {
        NODE_ENV: process.env.NODE_ENV,
        GROQ_API_KEY: process.env.GROQ_API_KEY ? '✓ Present' : '✗ Missing',
        // Add other variables you want to check
    });

} catch (error) {
    console.error('Environment setup failed:', error.message);
    process.exit(1);
}

const app = express();

// Updated CORS configuration
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Ensure JSON parsing is before routes
app.use(express.json());
app.use("/", express.static("build"));
app.use("/api/auth", authRoutes);
app.use("/api/whoami", userRoutes);
app.use('/api/lost-and-found', lostAndFoundRoutes);
app.use('*', (req, res) => {
    res.redirect('/');
});

const PORT = process.env.BACKEND_PORT || 5000;
const URL = process.env.REACT_BACKEND_API_URL || 'http://localhost:' + PORT;

// Initialize and start server
connectDB(process.env.MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on ${URL}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    });