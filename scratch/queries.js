'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { MONGODB_URI } = require('../config');

const {Note} = require('../models/note');

mongoose.connect(MONGODB_URI)
  // .then(() => {
  //   const searchTerm = 'lady gaga';
  // let filter = {};

  //   if (searchTerm) {
  //     const re = new RegExp(searchTerm, 'i');
  //     filter.title = { $regex: re };
  //   }

  //   return Note.find(filter)
  //     .sort('created')
  //     .then(results => {
  //       console.log(results);
  //     })
  //     .catch(console.error);
  // })
  // .then(() => {
  //   const noteId = '000000000000000000000000';
  //   return Note.findById(noteId)
  //     .then(result => {
  //       console.log(result);
  //     })
  //     .catch(console.error);
  // })
  // .then(() => {
  //   const newNote = {
  //     title: 'My Test Note',
  //     content: 'TEST TEST TEST'
  //   };
  //   return Note.create(newNote)
  //     .then(result => {
  //       console.log(result);
  //     })
  //     .catch(console.error);
  // })
  // .then(() => {
  //   const noteId = '5ae8cc1bca88a13a848f7065';
  //   const updateNote = {title: 'Updated Title'};
  //   return Note.findByIdAndUpdate(noteId, {$set: updateNote}, {new: true, upsert: true})
  //     .then(result => {
  //       console.log(result);
  //     })
  //     .catch(console.error);
  // })
  // .then(() => {
  //   const noteId = '5ae8cc1bca88a13a848f7065';
  //   return Note.findByIdAndRemove(noteId)
  //     .then(result => {
  //       console.log(result);
  //     })
  //     .catch(console.err);
  // })
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });