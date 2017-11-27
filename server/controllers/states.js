'use strict';
const express = require('express');
const States = require('./../models/states');
const shortid = require('shortid');
const bodyParser = require('body-parser');

var router = express.Router();
var jsonParser = bodyParser.json();

router.post('/', jsonParser, function(req, res) {

  let data = req.body;
  let pseudonym = shortid.generate();
  let state = new States({ data, pseudonym});
  state.save(function(err, state) {
    if (err) {
      console.log('Error inserting state', err)
      return res.status(500).send('Internal Server Error');
    }
    return res.status(201).send(pseudonym);
  });

});

router.get('/:id', function(req, res){

  States.find({ pseudonym : req.params.id }, function(err, state){
    if (err) {
      console.log('Error retrieving states from database with id - ', req.params.id, err);
      return res.status(400).send('Bad Request');
    }
    if(state.length === 0){
      return res.status(404).send('Not Found');
    }
    res.json(state);
  });
});

function addRegex(obj) {
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
