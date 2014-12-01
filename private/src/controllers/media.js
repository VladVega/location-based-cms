var Media = require('../models/media.js');
var Story = require('../models/story.js');
var lodash = require('lodash');

var MediaController = function(server) {
  server.route({
    path: '/api/stories/{story_id}/media',
    method: 'POST',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['story_id'])
      },
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data'
      },
      handler: function(request, reply) {
        var credentials = request.auth.credentials;
        var story_id = request.params.story_id;

        var content = request.payload.content;
        if (!content || !content.readable) {
          return reply(hjs.hapi.error.badRequest('File is not present or file upload input name is not content.'));
        }

        if (!content.hapi) {
          return reply(hjs.hapi.error.badRequest('Filename and Content-Type are not present.'));
        }

        var filename = content.hapi.filename;
        if (!filename) {
          return reply(hjs.hapi.error.badRequest('Filename is not present.'));
        }

        var content_type = content.hapi.headers['content-type'];
        if (!content_type) {
          return reply(hjs.hapi.error.badRequest('Content-type is not present.'));
        }

        hjs.async.waterfall([

          function(async_cb) {
            Story.get_by_id(story_id, credentials.id, async_cb);
          },
          function(story_model, async_cb) {
            var media_input = lodash.extend({
              mime_type: content_type,
              filename: filename
            }, lodash.pick(request.payload, Media.get_meta_fields_list()));

            var media = new Media(media_input);

            var errString = media.configure_storage_type(story_id);
            if (errString) {
              return async_cb(hjs.hapi.error.badRequest(errString));
            }

            media.save_binary(content, function(err_string, media_json) {
              if (err_string) {
                return async_cb(hjs.hapi.error.badRequest(err_string));
              }
              async_cb(null, story_model, media_json);
            });
          },
          function(story_model, media_json, async_cb) {
            story_model.media.push(media_json);
            story_model.save(function(err, story_updated_model) {
              if (err) {
                return async_cb(hjs.hapi.error.internal('Failed to save media to story: ' + story_id + ' err: ' + String(err)));
              }
              async_cb(null, story_updated_model.toJSON());
            });
          }
        ], function(err, story_updated) {
          reply(err || story_updated);
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
  server.route({
    path: '/api/stories/{story_id}/media/{media_id}',
    method: 'DELETE',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['story_id', 'media_id'])
      },
      handler: function(request, reply) {
        var credentials = request.auth.credentials;
        var story_id = request.params.story_id;
        var media_id = request.params.media_id;

        hjs.async.waterfall([

          function(async_cb) {
            Story.get_by_id(story_id, credentials.id, async_cb);
          },
          function(story_model, async_cb) {
            Media.delete_one(story_model, media_id, function(err, story_json) {
              if (err) {
                return async_cb(hjs.hapi.error.badRequest('Error deleting media: ' + media_id + ', story: ' + story_id + ', err: ' + String(err)));
              }
              async_cb(null, story_json);
            });
          }
        ], function(err, story_updated) {
          reply(err || story_updated);
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
};
module.exports = MediaController;
