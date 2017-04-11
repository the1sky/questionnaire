var path = require('path');
var async = require('async');
var _ = require('underscore');
var Questionnaire = require('../models/questionnaire');
var Question = require('../models/question');
var Option = require('../models/option');
var Answer = require('../models/answer');
var http = require('http');
var cache = require('memory-cache');
var sha1 = require('sha1'); //签名算法
var wechat_cfg = require('../server/config/wechat.cfg');
var signature = require('../server/sign/signature');

/**
 * 返回图片地址
 *
 * @param score
 * @returns {string}
 */
function getImages(score) {
  var url = '/images/';
  //return url + '1491871420.png';
  var suffix = 0;
  if (score == 100) {
    return url + 'score_100.jpg';
  } else if (score >= 96 && score <= 99) {
    suffix = Math.floor(Math.random() * 5);
    return url + 'score_96_99_' + suffix + '.jpg';
  } else if (score >= 71 && score <= 95) {
    suffix = Math.floor(Math.random() * 7);
    return url + 'score_71_95_' + suffix + '.jpg';
  } else if (score >= 56 && score <= 70) {
    suffix = Math.floor(Math.random() * 9);
    return url + 'score_56_70_' + suffix + '.jpg';
  } else {
    suffix = Math.floor(Math.random() * 5);
    return url + 'score_0_55_' + suffix + '.jpg';
  }
}

exports.indexPage = function (req, res) {
  var url = req.protocol + '://' + req.host + req.originalUrl; //获取当前url
  signature.sign(url, function (signatureMap) {
    signatureMap.appId = wechat_cfg.appid;
    console.log('sign obj:', signatureMap);
    res.render('app/index', signatureMap);
  });
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

/**
 * 提交问卷
 *
 * @param req
 * @param res
 */
exports.submit = function (req, res) {
  var questionnaireId = req.params.questionnaire;
  var sessionID = req.sessionID;
  var answer = req.body.answer;
  new Answer({
    sessionID: sessionID || 'passby',
    questionnaire: questionnaireId,
    content: answer
  }).save(function (err, answer) {
    var result = JSON.parse(answer.content);
    var questionIds = [];
    var optionIds = [];
    for (var questionId in result) {
      var options = result[questionId];
      if (options instanceof Array) {
        options.forEach(function (val, idx) {
          questionIds.push(questionId);
          optionIds.push(val);
        });
      } else {
        questionIds.push(questionId);
        optionIds.push(options);
      }
    }

    //查询各option项
    Option.find({question: {$in: questionIds}, _id: {$in: optionIds}}, function (err, docs) {
      var score = 0;
      docs.forEach(function (item, idx) {
        score += item.score || 0;
      });

      //保存得分
      Answer.update({
        'sessionID': sessionID,
        'questionnaire': questionnaireId
      }, {$set: {'score': score}}, function (err, doc) {
      });
    });
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
  var questionnaireId = req.params.questionnaire;
  Answer.findOne({sessionID: sessionID, 'questionnaire': questionnaireId}, function (err, docs) {
    if (!err && docs) {
      var score = docs._doc.score;
      res.json({
        success: true,
        image: getImages(score),
        score: score,
      });
    } else {
      res.json({
        success: true
      });
    }
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