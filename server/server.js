const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db')
const lostAndFoundRoutes = require('./routes/lostAndFoundRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB(process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use("/", express.static("build"));
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use("/api/whoami", userRoutes);
// app.use('/api/lost-and-found', lostAndFoundRoutes);
app.use('*', (req, res) => {
    res.redirect('/');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
