const mongoose = require('mongoose');
const _ = require('lodash');

const conceptStateSchema = new mongoose.Schema({
  criteria: String,
  id: String,
  sumScore: Number,
  totalCorrect: Number,
  totalIncorrect: Number,
  totalNeutral: Number
});

const scoreSchema = new mongoose.Schema({
  id: String,
  normalizedScore: Number,
  totalCorrect: Number,
  totalIncorrect: Number,
  totalNeutral: Number,
  totalAttempts: Number,
});

const hintDelivered = new mongoose.Schema({
  conceptId: String,
  scaledScore: String,
  challengeId: String,
  ruleCriteria: String, 
  ruleSelected: String,
  hintLevel: Number,
  timestamp: Date
}, { timestamps: true });

const studentModelSchema = new mongoose.Schema({
  concepts: [conceptStateSchema],
  hintHistory: [hintDelivered]
}, { timestamps: true });

studentModelSchema.methods.reset = function() {
  this.concepts = [];
  this.hintHistory = [];
}

studentModelSchema.methods.updateConceptState = function (criteria, conceptId, adjustment) {
  var conceptState = this.conceptState(criteria, conceptId);
  // Add new concept, if it doesn't already exist
  if (conceptState == null) {
    conceptState = {
      criteria: criteria,
      id: conceptId,
      scaledScore: 0,
      sumScore: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalNeutral: 0
    };
    this.concepts.push(conceptState);
    conceptState = this.concepts[this.concepts.length-1];
  }

  conceptState.sumScore += adjustment;
  if (adjustment > 0) {
    conceptState.totalCorrect += 1;
  } else if (adjustment < 0) {
    conceptState.totalIncorrect += 1;
  } else {
    conceptState.totalNeutral += 1;
  }
}

studentModelSchema.methods.averageScaledScore = function () {

  // Finding existing conceptState
  var correct = 0;
  var total = 0; 
  for (let concept of this.concepts) {
    correct += concept.totalCorrect;
    total += (concept.totalCorrect + concept.totalIncorrect);
  }   
  
  return  (total != 0 ? correct/total : 0);
}

studentModelSchema.methods.conceptScaledScore = function (criteria, conceptId) {
  var conceptState = this.conceptState(criteria, conceptId);
  if (!conceptState) {
    return undefined;
  }

  var total = (conceptState.totalCorrect + conceptState.totalIncorrect);
  return  (total != 0 ? conceptState.totalCorrect/total : 0);
}

studentModelSchema.methods.conceptScoreInfo = function (criteria, conceptId) {
  var conceptState = this.conceptState(criteria, conceptId);
  if (!conceptState) {
    return undefined;
  }

  var total = (conceptState.totalCorrect + conceptState.totalIncorrect);
  return {
     scaledScore: (total != 0 ? conceptState.totalCorrect/total : 0),
     correct: conceptState.totalCorrect,
     total: total
  };
}

studentModelSchema.methods.conceptState = function (criteria, conceptId) {
  var conceptState = null;

  // Finding existing conceptState
  for (let concept of this.concepts) {
    if (concept.criteria == criteria
      && concept.id == conceptId) {
      conceptState = concept;
      break;
    }
  }   
  
  return conceptState;
};

studentModelSchema.methods.modelConceptIds = function () {
  return _.uniq(this.concepts.map(function(a) {return a.id;})).sort();
}

studentModelSchema.methods.modelCriteria = function () {
  return _.uniq(this.concepts.map(function(a) {return a.criteria;})).sort();
}

studentModelSchema.methods.addHintToHistory = function (conceptId, scaledScore, challengeId, ruleCriteria, ruleSelected, hintLevel) {
  var hintDelivered = {
    conceptId: conceptId,
    scaledScore: scaledScore,
    challengeId: challengeId,
    ruleCriteria: ruleCriteria,
    ruleSelected: ruleSelected,
    hintLevel: hintLevel,
    timestamp: new Date()
  }
  this.hintHistory.push(hintDelivered);

  return hintDelivered;
}

studentModelSchema.methods.mostRecentHint = function(challengeId) {
  for (var i = this.hintHistory.length-1; i >= 0; --i) {
    var hintDelivered = this.hintHistory[i];
    if (hintDelivered.challengeId == challengeId) {
      return hintDelivered;
    }
  }

  return null;
}

studentModelSchema.methods.currentHintLevel = function (challengeId, target, selected) {
  var hintLevel = 0;
  for (var i = 0; i < this.hintHistory.length; ++i) {
    var previousHint = this.hintHistory[i];
    if (previousHint.challengeId == challengeId
      && previousHint.ruleCriteria == target
      && previousHint.ruleSelected == selected) {
        hintLevel = Math.max(hintLevel, previousHint.hintLevel);
      }
  }

  return hintLevel;
}

studentModelSchema.statics.create = function() {
  let studentModel = new StudentModel({
  });

  return studentModel;
}

const StudentModel = mongoose.model('StudentModel', studentModelSchema);

module.exports = StudentModel;
