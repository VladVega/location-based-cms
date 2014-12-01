var server = require('../src/app');
var Lab = require("lab");
var assert = require('assert');
var support = require('./support');

Lab.experiment('USER API', function() {
  Lab.experiment('GET /api/users/id', function() {
    Lab.test("retrieves public user object for a user when valid id sent", function(done) {
      var sample_mongo_id = support.fakes.credentials().id;

      var options = {
        method: "GET",
        url: "/api/users/" + sample_mongo_id
      };

      server.inject(options, function(response) {
        var result = response.result;

        Lab.expect(response.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Object);
        assert.equal(result.id, sample_mongo_id);
        assert(!result.email);

        done();
      });
    });
    Lab.test("retrieves self user object for a user when valid id sent", function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "GET",
        url: "/api/users/" + creds.id,
        credentials: creds
      };

      server.inject(options, function(response) {
        var result = response.result;

        Lab.expect(response.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Object);
        assert.deepEqual(creds, result);

        done();
      });
    });
    Lab.test("returns error when not valid id", function(done) {
      var options = {
        method: "GET",
        url: "/api/users/random54"
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });
    Lab.test("returns error when id does not exist", function(done) {
      var options = {
        method: "GET",
        url: "/api/users/" + support.fakes.mongo_id()
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 404);
        assert.equal(result.error, 'Not Found');
        done();
      });
    });
  });

  Lab.experiment('PUT /api/users/id', function() {
    Lab.test("returns 200 and updated object.", function(done) {
      var creds = support.fakes.credentials();
      var bio = 'This is my new bio. ' + Math.random();

      var options = {
        method: "PUT",
        url: "/api/users/" + creds.id,
        credentials: creds,
        payload: {
          bio: bio
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(result.bio, bio);
        done();
      });
    });
    Lab.test("returns error when no acceptable fields.", function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "PUT",
        url: "/api/users/" + creds.id,
        credentials: creds,
        payload: {
          hello: "Test User"
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });
    Lab.test("returns error when trying to edit a different user.", function(done) {
      var options = {
        method: "PUT",
        url: "/api/users/" + support.fakes.mongo_id(),
        credentials: support.fakes.credentials(),
        payload: {
          bio: "Test User"
        }
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 403);
        assert.equal(result.error, 'Forbidden');
        done();
      });
    });
    Lab.test("returns error when unauthed", function(done) {
      var options = {
        method: "PUT",
        url: "/api/users/" + support.fakes.mongo_id(),
        payload: {
          bio: "Test User"
        }
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 401);
        assert.equal(result.error, 'Unauthorized');
        done();
      });
    });
    Lab.test("returns error when not valid id", function(done) {
      var options = {
        method: "PUT",
        url: "/api/users/random45",
        credentials: support.fakes.credentials(),
        payload: {
          bio: "Test User"
        }
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });
  });
});
