'use strict';
const mongoose = require('mongoose');

module.exports = mongoose.model('music', {
  name: String,
  fileName: String,
  pseudonym: String
}, 'music');
