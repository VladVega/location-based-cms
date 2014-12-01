var Lab = require("lab");
var async = require("async");
var assert = require('assert');
var server = require('../src/app');
var support = require('./support');
var qs = require('querystring');

Lab.experiment('STORY-RETRIEVAL API', function() {
  var uidx = support.fakes.credentials2().id;
  var uidy = support.fakes.credentials().id;
  var num_stories_added;
  var num_unpublished = 0;
  var num_published_by_uidx = 0;
  var num_published_by_uidy = 0;
  var last_published_story_created_id;

  Lab.before(function(done) {
    var story_additions = [

      function(cb) {
        num_published_by_uidx++;
        support.helpers.add_story(uidx, {
          title: 'test',
          location: {
            "type": "Point",
            "coordinates": [10, 10]
          },
          tags: ['one', 'three', 'two'],
          publish: true
        }, cb);
      },
      function(cb) {
        num_published_by_uidx++;
        support.helpers.add_story(uidx, {
          title: 'test',
          location: {
            "type": "Point",
            "coordinates": [11, 11]
          },
          tags: ['one'],
          publish: true
        }, cb);
      },
      function(cb) {
        num_published_by_uidx++;
        support.helpers.add_story(uidx, {
          title: 'test',
          location: {
            "type": "Point",
            "coordinates": [8, 8]
          },
          tags: ['two'],
          publish: true
        }, cb);
      },
      function(cb) {
        num_published_by_uidy++;
        support.helpers.add_story(uidy, {
          title: 'test',
          location: {
            "type": "Point",
            "coordinates": [13, 13]
          },
          publish: true
        }, function(story_id) {
          last_published_story_created_id = story_id;
          cb();
        });
      },
      function(cb) {
        num_unpublished++;
        support.helpers.add_story(uidx, {
          title: 'test',
          location: {
            "type": "Point",
            "coordinates": [14, 14]
          }
        }, cb);
      }
    ];
    num_stories_added = story_additions.length;
    async.parallel(story_additions, done);
  });
  Lab.after(function(done) {
    support.helpers.delete_all_stories(done);
  });

  Lab.experiment('GET /api/stories/retrieve', function() {
    Lab.test("retrieves by most recent given no query params", function(done) {
      var options = {
        method: "GET",
        url: "/api/stories/retrieve"
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert.equal(result.length, num_stories_added - num_unpublished);
        assert(result[0].id = last_published_story_created_id); //most recent first

        done();
      });
    });
    Lab.test("retrieves by most recent by uid", function(done) {
      var query_str = qs.stringify({
        author: uidx
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert.equal(result.length, num_published_by_uidx);
        assert.equal(result[0].author.id, uidx);
        done();
      });
    });
    Lab.test("retrieves 0 len array when creator specified has no stories", function(done) {
      var query_str = qs.stringify({
        author: support.fakes.mongo_id2()
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert(Array.isArray(result));
        assert.equal(result.length, 0);
        done();
      });
    });
    Lab.test("retrieves len=1 array when creator specified has 1 story", function(done) {
      var query_str = qs.stringify({
        author: uidy
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert(Array.isArray(result));
        assert.equal(result.length, 1);
        assert.equal(result[0].author.id, uidy);
        done();
      });
    });
    Lab.test("retrieves stories by nearest sort", function(done) {
      var query_str = qs.stringify({
        current_loc_coordinates: [1, 1]
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert.equal(result.length, num_stories_added - num_unpublished);

        var sum = 2; //curr loc is 1,1 so every sum should be higher can next
        result.forEach(function(story) {
          var next_sum = story.location.coordinates.reduce(function(total, num) {
            return total + num;
          });
          assert(next_sum > sum);
          sum = next_sum;
        });

        done();
      });
    });
    Lab.test("retrieves stories by nearest sort and certain user", function(done) {
      var query_str = qs.stringify({
        current_loc_coordinates: [1, 1],
        author: uidx
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert.equal(result.length, num_published_by_uidx);

        var sum = 2; //curr loc is 1,1 so every sum should be higher can next
        result.forEach(function(story) {
          var next_sum = story.location.coordinates.reduce(function(total, num) {
            return total + num;
          });
          assert(next_sum > sum);
          sum = next_sum;
        });

        done();
      });
    });
    Lab.test("retrieves array that matches any of the given tags", function(done) {
      var query_str = qs.stringify({
        tags: ['one', 'two']
      });
      var options = {
        method: "GET",
        url: "/api/stories/retrieve?" + query_str
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert(Array.isArray(result));
        assert.equal(result.length, 3);
        done();
      });
    });
  });
});
