var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var Option = mongoose.model('Option', new Schema({
  question: {
    type: ObjectId,
    ref: 'Question'
  },
  score: Number,
  content: String
}));

module.exports = Option;