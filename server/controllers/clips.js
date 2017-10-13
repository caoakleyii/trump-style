const express = require('express');
const Clips = require('./../models/clips');
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
  Clips.find(query.selector)
  .limit(query.limit)
  .skip(query.skip)
  .sort(query.sort)
  .exec(function(err, drinks){
    if (err) {
      return res.status(400).send('Bad Request');
    }
    res.json(drinks);
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
