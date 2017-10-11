const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const clips_controller = require('./server/controllers/clips');

mongoose.connect('mongodb://localhost/trumpstyle');

app.use(express.static('public'));

app.get('/*', function(req, res, next) {
  var referrer = req.get('Referer');

  if (referrer === 'http://trumpstyle.com/' || referrer === 'http://localhost:3000') {
      // TODO: when i have a domain name
  }
  res.header('Access-Control-Allow-Origin', "*");
  next();
});

app.use('/clips', clips_controller);

app.get('*', function(req, res) {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.listen(3000, function() {
  console.log('App running on port 3000');
});
