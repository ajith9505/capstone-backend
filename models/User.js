//importing mongoose
const mongoose = require('mongoose')

//creating schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

//creating and exporting mongoose model
module.exports = mongoose.model('Users', userSchema)
