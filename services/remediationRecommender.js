'use strict';

const RemediationRepository = require('../storage/remediationRepository');
const Group = require('../models/Group');
const TutorAction = require('../models/TutorAction');

/**
 * This evaluates the student model and decides whether or not a hint
 * should be given to the student.
 */
class RemediationRecommender {
    constructor() {
        this.remediationRepository = new RemediationRepository(global.cacheDirectory);
    }

    initializeAsync(session, groupName, tags) {
        return Group.getCollectionIdsAsync(groupName, tags).then((ids) => {
            if (ids.length == 0) {
                session.warningAlert("Unable to find Google Sheet with tags (" + tags + ") in  group '" + groupName + "'");
            }

            return this.remediationRepository.loadCollectionsAsync(ids);
        });
    }    

    // Based on current event and student model, determine if remediation is necessary 
    evaluateAsync(student, session, event) {
        let studentModel = student.studentModel;
        let groupName = session.groupId;
        return this.initializeAsync(session, groupName, "remediation").then(() => {
            let misconceptions = studentModel.getMisconceptionsForEvent(event);
            if (misconceptions.length > 0) {
                misconceptions.forEach((misconception) => {
                    let conceptState = studentModel.getBktConceptState(misconception.conceptId);
                    misconception.conceptState = conceptState;
                });
    
                let challengeId = event.context.challengeId;
                return this._selectHint(
                    student,
                    session, 
                    groupName, 
                    event.context.challengeType, 
                    challengeId, 
                    misconceptions);
            }

            return null;
        });
    }

    _selectHint(student, session, groupId, challengeType, challengeId, misconceptions) {
        if (!challengeType) {
            throw new Error("challengeType not defined in context")
        }
        console.info("Observed incorrect concepts:");
        let mostRecentRemediation = student.studentModel.mostRecentAction("REMEDIATE", challengeId);
        misconceptions = this._sortMisconceptionsByPreviousHintAndThenAscendingScore(misconceptions, mostRecentRemediation);
        for (let misconception of misconceptions) {
            console.info("   " + misconception.conceptId + " | " + misconception.attribute + " | " + misconception.conceptState.probabilityLearned + " | " + misconception.source);
        }

        let remediationsForChallengeType = this.remediationRepository.filter(challengeType);
        for (let misconception of misconceptions) {
            let remediations = remediationsForChallengeType.filter((item) => 
                item.conceptId === misconception.conceptId 
                && misconception.conceptState.totalAttempts >= item.minimumAttempts
                && misconception.conceptState.probabilityLearned <= item.probabilityLearnedThreshold);

            if (remediations && remediations.length > 0) { 
                let remediation = remediations[0];

                mostRecentRemediation = student.studentModel.mostRecentAction("REMEDIATE", challengeId);
                // TODO: Determine if this is bottom out remediation
                let isBottomOut = false;

                let action = TutorAction.createRemediateAction(
                    "MisconceptionDetected",
                    remediation.priority,
                    RemediationRepository.sourceAsUrl(remediation),
                    misconception.conceptId,
                    misconception.conceptState.probabilityLearned,
                    challengeType,
                    challengeId, 
                    remediation.practiceCriteria,
                    misconception.attribute,
                    isBottomOut);

                return action;
            }
        }
        return null;     
    };

    _sortMisconceptionsByPreviousHintAndThenAscendingScore(misconceptions, mostRecentRemediation) {
        return misconceptions.sort(function(a, b) {
            if (mostRecentRemediation && a.conceptId == b.conceptId) {
                return (a.conceptId == mostRecentRemediation.context.conceptId ? 1 : -1);
            } else {
                return a.probabilityLearned -  b.probabilityLearned;
            }
        });
    }
}

module.exports = RemediationRecommender;