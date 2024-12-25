import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lostAndFoundRoutes from './routes/lostAndFoundRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({
    path: path.resolve(__dirname, '../.env.development')
});

// Validate essential environment variables
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in environment variables');
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
app.use(bodyParser.json());
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