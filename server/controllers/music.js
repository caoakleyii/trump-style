'use strict';
const express = require('express');
const Music = require('./../models/music');
var router = express.Router();

router.get('/', function(req, res){
  var defaults = {
   selector : {},
   sort: {},
   limit : 150,
   skip : 0
 };

 if (req.query.selector) {
   req.query.selector = JSON.parse(req.query.selector);
 }
 var sort = {};
 var query = {};

 Object.assign(query, defaults, req.query);

 if (query.selector) {
   addRegex(query.selector);
 }

  Music.find(query.selector)
  .limit(query.limit)
  .skip(query.skip)
  .sort(query.sort)
  .exec(function(err, music){
    if (err) {
      return res.status(400).send('Bad Request');
    }
    res.json(music);
  });
});

function addRegex(obj){
  for (var property in obj){
    var propValue = obj[property];
    if (typeof(propValue) === "string") {
      obj[property] = new RegExp(propValue);
    } else if (typeof(propValue) === "object") {
      addRegex(propValue);
    }
  }
}

module.exports = router;
