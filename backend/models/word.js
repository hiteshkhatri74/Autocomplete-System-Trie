const mongoose = require('mongoose');

const wordSchema = mongoose.Schema({
    text : {
        type : String,            // each document will store a word as a string
        required : true,          // it must have a value
        unique : true,            // no duplicate words allowed
        index : true              // speeds up search/autocomplete queries
    }
},{
    timestamps : true             // automatically adds createdAt & updatedAt fields
});

module.exports = mongoose.model('word', wordSchema);