'use strict';
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const clips_controller = require('./server/controllers/clips');
const music_controller = require('./server/controllers/music');
const states_controller = require('./server/controllers/states');
const body_parser = require('body-parser');

let PORT = 3000;
mongoose.connect('mongodb://localhost/trumpstyle');


if (process.env.NODE_ENV == 'production') {
  PORT = 8080;
}

app.use(express.static('public'));
app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());

app.get('/*', function(req, res, next) {
  var referrer = req.get('Referer');

  if (referrer === 'http://trumpstyle.com/' || referrer === 'http://localhost:3000') {
      // TODO: when i have a domain name
  }
  res.header('Access-Control-Allow-Origin', "*");
  next();
});

app.use('/api/clips', clips_controller);
app.use('/api/music', music_controller);
app.use('/api/states', states_controller);

app.get('*', function(req, res) {
  if(!process.env.NODE_ENV || process.env.NODE_ENV == 'DEBUG') {
    res.sendFile(path.resolve(__dirname, 'index_dev.html'));
  } else {
    res.sendFile(path.resolve(__dirname, 'index.html'));
  }
});

app.listen(PORT, function() {
  console.log('App running on port', PORT);
});
