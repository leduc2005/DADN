require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Import Database Connection (Singleton Pattern)
const db = require('./config/db');

// Middlewares
app.use(cors());
app.use(express.json()); // Để server hiểu được JSON request

// Basic Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Mixer System API is running successfully! 🚀' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
