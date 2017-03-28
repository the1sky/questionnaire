var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var Answer = mongoose.model('Answer', new Schema({
  user: ObjectId,
  sessionID: String,
  questionnaire: {
    type: ObjectId,
    ref: 'Questionnaire'
  },
  score: {
    type: Number,
    default: 0
  },
  content: String
}));

module.exports = Answer;