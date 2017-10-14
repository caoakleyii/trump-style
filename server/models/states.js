const mongoose = require('mongoose');

module.exports = mongoose.model('states', {
  data: mongoose.Schema.Types.Mixed,
  pseudonym: String
});
