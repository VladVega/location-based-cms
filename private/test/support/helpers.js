var async = require('async');
var lodash = require('lodash');
var server = require('../../src/app');

var story_id_credId_hash = {};

var helpers = {
  add_story: function(user_id, payload, cb) {
    var body = payload || {
      title: 'test title',
      text: 'sample text',
      location: {
        "type": "Point",
        "coordinates": [125.6, 10.1]
      },
      location_description: 'loc desc',
      tags: ['keyword_a', 'keyword_b'],
      publish: true
    };

    var options = {
      method: "POST",
      url: "/api/stories",
      credentials: {
        id: user_id
      },
      payload: body
    };

    server.inject(options, function(response) {
      helpers.manage_story(response.result.id, user_id);
      cb(response.result.id);
    });
  },
  get_story: function(id, creds, cb) {
    var options = {
      method: "GET",
      url: "/api/stories/" + id,
      credentials: {
        id: id
      }
    };

    server.inject(options, function(response) {
      cb(response.result);
    });
  },
  delete_all_stories: function(cb) {
    async.each(
      lodash.keys(story_id_credId_hash),
      function(id, async_cb) {
        var options = {
          method: "DELETE",
          url: "/api/stories/" + id,
          credentials: {
            id: story_id_credId_hash[id]
          }
        };
        server.inject(options, function() {
          async_cb();
        });
      },
      cb
    );
  },
  manage_story: function(story_id, uid) {
    story_id_credId_hash[story_id] = uid;
  }
};
module.exports = helpers;
