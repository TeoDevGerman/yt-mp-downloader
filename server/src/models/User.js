const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: [{ type: String }], // Array of YouTube URLs or IDs
    downloads: [{ type: String }], // Array of file paths or IDs
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
