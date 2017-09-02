const Alert = require('../models/Alert');
const moment = require('moment');

/**
 * GET /
 * Alerts page.
 */
exports.index = (req, res) => {
  Alert.find({}).exec().then((alerts) => {
    res.render('alerts', {
      title: 'Alerts',
      alerts: alerts
    });
  }).catch((err) => {
    console.error(err);
    req.flash('errors', { msg: err.toString() });
    return res.redirect('/');
  });
};

exports.clear = (req, res) => {
  Alert.remove({}).then(() => {
    return res.redirect('/alerts');
  }).catch((err) => {
    console.error(err);
    req.flash('errors', { msg: err.toString() });
  });
};
