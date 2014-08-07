var mongoose = require('mongoose');


// Define a language model
module.exports = mongoose.model('SkiArea', {
	"name": String,
    "wikiURL": String,
    "yearlySnowfall": Number,
    "skiableAcres": Number,
    "advanced": Number,
    "expert": Number,
    "top": Number,
    "base": Number,
})