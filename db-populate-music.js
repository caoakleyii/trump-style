const mongoose = require('mongoose');
const shortid = require('shortid');
mongoose.connect('mongodb://localhost/trumpstyle');

var db = mongoose.connection;

// add in the clips.
db.collection('music').insertOne({ name: 'Summer Dream', fileName: 'summer-dream.mp3', pseudonym: shortid.generate() });
db.collection('music').insertOne({ name: 'Hard Work', fileName: 'hard-work.mp3', pseudonym: shortid.generate() });
db.collection('music').insertOne({ name: 'Unity', fileName: 'unity.wav', pseudonym: shortid.generate() });
db.collection('music').insertOne({ name: 'Acoustic', fileName: 'acoustic.mp3', pseudonym: shortid.generate() });
db.collection('music').insertOne({ name: 'Let\'s Walk Away', fileName: 'lets_walk_away.mp3', pseudonym: shortid.generate() });
db.collection('music').insertOne({ name: 'Summit', fileName: 'summit.mp3', pseudonym: shortid.generate() });
