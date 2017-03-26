var path = require('path');
var async = require('async');
var _ = require('underscore');
var Questionnaire = require('../models/questionnaire');
var Question = require('../models/question');
var Option = require('../models/option');
var Answer = require('../models/answer');

function getImages(score) {
  var url = '/images/';
  if (score == 100) {
    return url + 'score_100.jpeg';
  } else if (score >= 96 && score <= 99) {
    return url + 'score_96_99.jpeg';
  } else if (score >= 71 && score <= 95) {
    return url + 'score_71_95.jpeg';
  } else if (score >= 56 && score <= 70) {
    return url + 'score_56_70.jpeg';
  } else {
    var suffix = Math.ceil(Math.random() * 5);
    return url + 'score_random_' + suffix + '.jpeg';
  }
}

exports.indexPage = function (req, res) {
  res.sendFile(path.join(__dirname, '../view/app/index.html'));
};

exports.questionnaireData = function (req, res) {
  var sessionID = req.sessionID;
  Answer.find({sessionID: sessionID}, function (err, docs) {
    if (!err && docs.length > 0) {
      res.json({
        success: true,
        done: true,
      });
    } else {
      var questionnaireId = req.params.questionnaire;
      Questionnaire.findById(questionnaireId)
        .select('title questions')
        .populate({
          path: 'questions',
          select: 'content type'
        })
        .exec(function (err, questionaire) {
          async.map(questionaire.questions, function (question, callback) {
            Option.find({question: question._id})
              .select('content')
              .exec(function (err, options) {
                var _question = question.toObject();
                _question.options = options;
                callback(err, _question);
              })
          }, function (err, results) {
            if (err) {
              return res.json({
                success: false,
                error: err.message
              })
            }
            res.json({
              success: true,
              title: questionaire.title,
              questions: results,
              done: false
            });
          });
        });
    }
  });
};

exports.submit = function (req, res) {
  var questionnaireId = req.params.questionnaire;
  var answer = req.body.answer;
  new Answer({
    sessionID: req.sessionID || 'passby',
    questionnaire: questionnaireId,
    content: answer
  }).save(function (err, answer) {
    if (err) {
      return res.json({
        success: false,
        error: err.message
      })
    }
    res.json({
      success: true
    });
  });
};

/**
 * 获取得分
 *
 * @param req
 * @param res
 */
exports.getScoreResult = function (req, res) {
  var sessionID = req.sessionID;
  Answer.find({sessionID: sessionID}, function (err, docs) {
    var score = Math.ceil(Math.random() * 100);
    res.json({
      success: true,
      image: getImages(score)
    });
  })
};


exports.resultPage = function (req, res) {
  res.sendFile(path.join(__dirname, '../view/manage/statistics.html'));
  //res.sendFile(path.join(__dirname, '../view/app/result.html'));
};


exports.statistics = function (req, res) {
  var questionnaireId = req.params.questionnaire;
  Questionnaire.findById(questionnaireId)
    .select('title questions')
    .populate({
      path: 'questions',
      select: 'type content'
    })
    .lean()
    .exec(function (err, questionnaire) {
      var questions = questionnaire.questions;
      console.log(questions);
      async.each(questions, function (question, callback) {
        if (question.type == 1) {
          Option.find({question: question._id})
            .select('content')
            .lean()
            .exec(function (err, options) {
              options.forEach(function (option) {
                option.count = 0;
              });
              question.options = options;
              console.log(options);
              callback(err);
            });
        } else if (question.type == 2) {
          Option.find({question: question._id})
            .select('content')
            .lean()
            .exec(function (err, options) {
              options.forEach(function (option) {
                option.count = 0;
              });
              question.options = options;
              callback(err);
            });
        } else {
          question.replies = [];
          callback(err);
        }
      }, function (err) {
        if (err) {
          return res.json({
            success: false,
            error: err.message
          });
        }
        Answer.find({questionnaire: questionnaireId})
          .select('content')
          .exec(function (err, answers) {
            async.each(answers, function (_answer, callback) {
              var answer = JSON.parse(_answer.content);
              for (var questionId in answer) {
                if (answer.hasOwnProperty(questionId)) {
                  for (var i = 0, len = questions.length; i < len; i++) {
                    var question = questions[i];
                    if (question._id == questionId) {
                      if (question.type == 1) {
                        var optionId = answer[questionId];
                        console.log(questionId, optionId);
                        for (var j = 0, l = question.options.length; j < l; j++) {
                          var option = question.options[j];
                          if (option._id == optionId) {
                            option.count++;
                            break;
                          }
                        }
                      }
                      if (question.type == 2) {
                        var options = answer[questionId];
                        options.forEach(function (optionId) {
                          for (var j = 0, l = question.options.length; j < l; j++) {
                            var option = question.options[j];
                            if (option._id == optionId) {
                              option.count++;
                              break;
                            }
                          }
                        });
                      }
                      if (question.type == 3) {
                        if (answer[questionId] != '') {
                          question.replies.push(answer[questionId]);
                        }
                      }
                      break;
                    }
                  }
                }
              }
              callback(err);
            }, function (err) {
              if (err) {
                return res.json({
                  success: false,
                  error: err.message
                });
              }
              return res.json({
                success: true,
                questionnaire: questionnaire
              });
            });
          });
      });

    });
};