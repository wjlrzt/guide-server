const Student = require('../models/Student');
const moment = require('moment');

/**
 * GET /
 * Students page.
 */
exports.index = (req, res) => {
  const studentId = req.params.studentId;
  if (!studentId) {
    return res.redirect(process.env.BASE_PATH + 'students');
  }

  Student.findOne({ 'id': studentId }).exec()
    .then((student) => {
      
      res.render('tutor-actions', {
        title: 'Tutor Actions',
        student: student,
        tutorActionHistory: student.studentModel.tutorActionHistory
      });
    })
    .catch((err) => {
      console.error(err);
      req.flash('errors', { msg: 'Unable to load student. ' + err.toString()});
      return res.send({redirect: './students'});
    });
};