'use strict';
const mongoose = require('mongoose');

module.exports = mongoose.model('clips', {
  name: String,
  fileName: String,
  pseudonym: String
});
