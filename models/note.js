'use strict';

const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String},
  timestamps: true
});

const Note = mongoose.model('Note', noteSchema);
module.exports = {Note};