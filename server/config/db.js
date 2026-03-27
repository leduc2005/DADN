const mongoose = require('mongoose');

class Database {
    constructor() {
        this._connect();
    }

    _connect() {
        // Sử dụng URI từ file .env hoặc URI mặc định
        const URI = process.env.MONGO_URI || 'mongodb://localhost:27017/MixerSystem';
        
        mongoose.connect(URI)
        .then(() => {
            console.log(`MongoDB connection successful! (Target: ${URI})`);
        })
        .catch(err => {
            console.error('MongoDB connection error: ', err);
        });
    }
}

// Export a single instance to ensure Singleton pattern
module.exports = new Database();
