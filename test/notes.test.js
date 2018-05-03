'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const { Note } = require('../models/note');
const {Folder} = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;
chai.use(chaiHttp);

describe('note api', function () {
  this.timeout(5000);
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Note.insertMany(seedNotes),
      Folder.insertMany(seedFolders)
    ])
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/notes', function () {
    // 1) Call the database **and** the API
    // 2) Wait for both promises to resolve using `Promise.all`
    it('should return the correct number of Notes', function () {
      return Promise.all([
        Note.find(),
        chai.request(app).get('/api/notes')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should test to see if list of objects has correct keys', function () {
      return Promise.all([
        Note.find(),
        chai.request(app).get('/api/notes')
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(note => {
            expect(note).to.be.a('object');
            expect(note).to.include.keys('id', 'title', 'createdAt', 'updatedAt');
          });
        });
    });

    it('should return correct notes based on search query', function () {
      const searchTerm = 'test';
      const re = new RegExp(searchTerm, 'i');

      return Promise.all([
        Note.find({ $or: [{ title: re }, { content: re }] }),
        chai.request(app).get(`/api/notes/?searchTerm=${searchTerm}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);

        });
    });

    it('should return correct search results for a folderId query', function () {
      let data;
      return Folder.findOne()
        .then((_data) => {
          data = _data;
          return Promise.all([
            Note.find({ folderId: data.id }),
            chai.request(app).get(`/api/notes?folderId=${data.id}`)
          ]);
        })
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return empty array if searchTerm is invalid', function () {
      const searchTerm = 'asdfg';
      const re = new RegExp(searchTerm, 'i');

      return Promise.all([
        Note.find({ $or: [{ title: re }, { content: re }] }),
        chai.request(app).get(`/api/notes/?searchTerm=${searchTerm}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);

        });
    });
  });

  describe('GET /api/notes/:id', function () {
    it('should return correct note', function () {
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app)
            .get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

          // 3) then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should return status 400 for bad id', function () {
      const badId = 123;

      return Promise.all([
        Note.find({ id: badId }),
        chai.request(app).get(`/api/notes/${badId}`)
      ])
        .then(([data, res]) => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
          expect(data).to.throw;
        });

    });
  });

  describe('POST /api/notes', function () {
    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };

      let res;
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(newItem)
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'createdAt', 'updatedAt');
          // 2) then call the database
          return Note.findById(res.body.id);
        })
        // 3) then compare the API response to the database results
        .then(data => {
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should return an error if title is missing', function () {
      const badItem = {
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      // 1) First, call the API
      return chai.request(app)
        .post('/api/notes')
        .send(badItem)
        .then(function (res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
  });

  describe('PUT /api/notes/:id', function () {
    it('should update item when given valid data', function () {
      const updateItem = { title: 'updated', content: 'test test test' };
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .send(updateItem);
        });
    });

    it('should return an error if title is missing', function () {
      const badItem = {
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
      };
      // 1) First, call the API
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app)
            .post('/api/notes')
            .send(badItem);
        })
        .then(function (res) {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

    it('should return an error when incorrect id is passed in', function () {
      const badId = 1234;
      const updateItem = { title: 'updated', content: 'test test test' };
      return chai.request(app)
        .put(`/api/notes/${badId}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });
  });

  describe('DELETE /api/notes/:id', function () {
    it('should delete item corresponding to passed in id', function () {
      let data;
      // 1) First, call the database
      return Note.findOne()
        .then(_data => {
          data = _data;
          // 2) then call the API with the ID
          return chai.request(app)
            .delete(`/api/notes/${data.id}`);
        })
        .then(res => {
          expect(res).to.have.status(204);
        });
    });
  });

});