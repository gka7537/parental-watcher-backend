/**
 * MongoDB Database Connection
 */

const mongoose = require('mongoose');
const config = require('../config/index');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
