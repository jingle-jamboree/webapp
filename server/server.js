const express = require('express');
const bodyParser = require('body-parser');
const lostAndFoundRoutes = require('./routes/lostAndFoundRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/api/lost-and-found', lostAndFoundRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});