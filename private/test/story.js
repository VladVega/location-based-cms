var Lab = require("lab");
var assert = require('assert');
var server = require('../src/app');
var support = require('./support');

Lab.experiment('STORY API', function() {
  var story_created_by_another_id;

  Lab.before(function(done) {
    support.helpers.add_story(support.fakes.mongo_id(), null, function(id_o) {
      story_created_by_another_id = id_o;
      done();
    });
  });
  Lab.after(function(done) {
    support.helpers.delete_all_stories(done);
  });

  Lab.experiment('GET /api/stories/id', function() {
    var story_created_by_self_id;
    var story_unpublished_by_another_id;
    var story_unpublished_by_self_id;
    Lab.before(function(done) {
      var payload = {
        title: 'test title',
        text: 'sample text',
        location: {
          "type": "Point",
          "coordinates": [125.6, 10.1]
        },
        location_description: 'loc desc',
        tags: ['keyword_a', 'keyword_b']
      };

      support.helpers.add_story(support.fakes.credentials().id, null, function(id_s) {
        story_created_by_self_id = id_s;
        support.helpers.add_story(support.fakes.credentials().id, payload, function(id_us) {
          story_unpublished_by_self_id = id_us;
          support.helpers.add_story(support.fakes.mongo_id(), payload, function(id_uo) {
            story_unpublished_by_another_id = id_uo;
            done();
          });
        });
      });
    });

    Lab.test("retrieves published story with no auth", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/" + story_created_by_self_id
      };

      server.inject(options, function(response) {
        var result = response.result;

        Lab.expect(response.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Object);
        assert.equal(result.id, story_created_by_self_id);
        assert(typeof result.title === 'string');
        assert(typeof result.text === 'string');
        assert(typeof result.location == 'object');

        done();
      });
    });
    Lab.test("retrieves own-created not published story", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/" + story_unpublished_by_self_id,
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        Lab.expect(result).to.be.instanceof(Object);
        assert.equal(result.id, story_unpublished_by_self_id);
        assert(typeof result.title === 'string');
        assert(typeof result.text === 'string');
        assert(typeof result.location == 'object');

        done();
      });
    });
    Lab.test("error when retrieving someone elses un-published story with your auth", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/" + story_unpublished_by_another_id,
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 403);
        assert.equal(result.error, 'Forbidden');
        done();
      });
    });
    Lab.test("error when retrieving someone elses un-published story with no auth", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/" + story_unpublished_by_another_id
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 403);
        assert.equal(result.error, 'Forbidden');
        done();
      });
    });
    Lab.test("returns error when not valid id", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/random54"
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
        url: "/api/stories/" + support.fakes.mongo_id()
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 404);
        assert.equal(result.error, 'Not Found');
        done();
      });
    });
  });
  Lab.experiment('DELETE /api/stories/id', function() {
    var story_created_by_self_id;
    var story_created_by_self_id2;

    Lab.before(function(done) {
      support.helpers.add_story(support.fakes.credentials().id, null, function(id_s) {
        story_created_by_self_id = id_s;
        support.helpers.add_story(support.fakes.credentials().id, null, function(id_s2) {
          story_created_by_self_id2 = id_s2;
          done();
        });
      });
    });

    Lab.test("returns 200 and deletes object.", function(done) {
      var creds = support.fakes.credentials();
      var title = 'different title. ' + Math.random();

      var options = {
        method: "DELETE",
        url: "/api/stories/" + story_created_by_self_id,
        credentials: creds,
        payload: {
          title: title,
          publish: false
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 200);
        assert(result.success);

        support.helpers.get_story(story_created_by_self_id, creds, function(result) {
          assert.equal(result.error, 'Not Found');
          done();
        });
      });
    });
    Lab.test("returns error when trying to edit a different story.", function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/" + story_created_by_another_id,
        credentials: support.fakes.credentials()
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
        method: "DELETE",
        url: "/api/stories/" + story_created_by_self_id2,
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
        method: "DELETE",
        url: "/api/stories/random45",
        credentials: support.fakes.credentials(),
        payload: {
          title: "Test User"
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

  Lab.experiment('PUT /api/stories/id', function() {
    var story_created_by_self_id;

    Lab.before(function(done) {
      support.helpers.add_story(support.fakes.credentials().id, null, function(id_s) {
        story_created_by_self_id = id_s;
        done();
      });
    });

    Lab.test("returns 200 and updated object.", function(done) {
      var creds = support.fakes.credentials();
      var title = 'different title. ' + Math.random();

      var options = {
        method: "PUT",
        url: "/api/stories/" + story_created_by_self_id,
        credentials: creds,
        payload: {
          title: title,
          publish: false
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(result.title, title);
        assert(!result.publish);
        assert.equal(result.id, story_created_by_self_id);
        done();
      });
    });
    Lab.test("returns error when no acceptable fields.", function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "PUT",
        url: "/api/stories/" + story_created_by_self_id,
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
    Lab.test("returns error when trying to edit a different story.", function(done) {
      var options = {
        method: "PUT",
        url: "/api/stories/" + story_created_by_another_id,
        credentials: support.fakes.credentials(),
        payload: {
          title: "Test title change."
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
        url: "/api/stories/" + story_created_by_self_id,
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
        url: "/api/stories/random45",
        credentials: support.fakes.credentials(),
        payload: {
          title: "Test User"
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
  Lab.experiment('POST /api/stories', function() {
    Lab.test("returns 200 and new object.", function(done) {
      var creds = support.fakes.credentials();
      var title = 'new title ' + Math.random();

      var options = {
        method: "POST",
        url: "/api/stories",
        credentials: creds,
        payload: {
          title: title,
          text: 'sample text',
          location: {
            "type": "Point",
            "coordinates": [125.6, 10.1]
          },
          location_description: 'loc desc',
          tags: ['keyword_a', 'keyword_b'],
          publish: true
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 200);
        assert.equal(result.title, title);
        assert(result.publish);
        assert(result.first_published_time);
        assert(result.location);
        assert(result.location_description);
        assert(result.tags);
        assert(result.id);
        support.helpers.manage_story(result.id, creds.id);
        done();
      });
    });
    Lab.test("returns error when no title.", function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "POST",
        url: "/api/stories",
        credentials: creds,
        payload: {
          text: "Test text"
        }
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });
    Lab.test("returns error when unauthed", function(done) {
      var options = {
        method: "POST",
        url: "/api/stories",
        payload: {
          title: 'hi'
        }
      };
      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 401);
        assert.equal(result.error, 'Unauthorized');
        done();
      });
    });
  });
});
