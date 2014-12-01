var Story = require('../models/story.js');
var lodash = require('lodash');
var User = require('../models/user.js');
var Joi = require('joi');
var GJV = require("geojson-validation");

var StoryController = function(server) {
  //TODO media upload

  server.route({
    //Web url should show everything but current geoloc in url (but it doesn't need to be passed to request
    path: '/api/stories/retrieve',
    method: ['GET', 'POST'],
    config: {
      validate: {
        query: {
          sort: Joi.string().valid('recent', 'nearest').default('nearest'),
          author: Joi.string(),
          current_loc_coordinates: Joi.array().length(2).includes(Joi.number()), //simple point coor array for query param only
          limit: Joi.number().max(50).default(20),
          tags: Joi.array(),
          max_distance: Joi.number()
        }
      },
      handler: function(request, reply) {
        var query = {
          publish: true
        };
        var current_geoJSON = request.query.current_loc_coordinates ? {
          type: 'Point',
          coordinates: request.query.current_loc_coordinates
        } : null;

        if (current_geoJSON && request.query.sort == 'nearest') {
          query.location = {
            $near: {
              $geometry: current_geoJSON
            }
          };
          if (request.query.max_distance) {
            query.location.$near.$maxDistance = request.query.max_distance;
          }
        }
        if (request.query.author) {
          query.author = request.query.author;
        }
        if (request.query.tags) {
          query.tags = {
            $in: request.query.tags
          };
        }
        Story.find(query).limit(request.query.limit).exec(function(err, stories) {
          if (err) {
            return reply(hjs.hapi.error.internal('Failed to retrieve story collection from db: ' + query.toString() + ' err: ' + String(err)));
          }
          if (!stories || !stories.length) {
            return reply([]);
          }
          User.populate(stories, {path: 'author', select: 'id display_name'}, function(err, populated_stories) {
            if (err) {
              return reply(hjs.hapi.error.internal('Failed to retrieve user collection from db: ' + query.toString() + ' err: ' + String(err)));
            }
            reply(populated_stories.map(function(s) {
              return s.get_list_view();
            }));
          });
        });
      }
    }
  });

  server.route({
    path: '/api/stories/{id}',
    method: 'GET',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['id'])
      },
      handler: function(request, reply) {
        var story_id = request.params.id;
        var credentials = request.auth.credentials;

        Story.get_by_id(story_id, '', function(err, db_story) {
          if (err) {
            return reply(err);
          }
          if (!db_story.publish && (!lodash.isObject(credentials) || credentials.id != db_story.author)) {
            return reply(hjs.hapi.error.forbidden('You are not authorized to view this story: ' + story_id));
          }
          reply(db_story.toJSON());
        });
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    }
  });
  server.route({
    path: '/api/stories/{id}',
    method: 'PUT',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['id']),
        payload: {
          title: Joi.string().max(100),
          text: Joi.string(),
          location: Joi.object(),
          location_description: Joi.string(),
          publish: Joi.boolean(),
          tags: Joi.array()
        }
      },
      handler: function(request, reply) {
        var story_id = request.params.id;
        var credentials = request.auth.credentials;

        if (request.payload && request.payload.location && !GJV.isPoint(request.payload.location)) {
          return reply(hjs.hapi.error.badRequest('location is not valid geoJSON point.'));
        }

        Story.get_by_id(story_id, credentials.id, function(err, story) {
          if (err) {
            return reply(err);
          }

          lodash.extend(story, request.payload);
          story.save(function(err, db_story) {
            if (err) {
              return reply(hjs.hapi.error.internal('Failed to save story to db: ' + story_id + ' err: ' + String(err)));
            }
            reply(db_story.toJSON());
          });
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
  server.route({
    path: '/api/stories/{id}',
    method: 'DELETE',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['id'])
      },
      handler: function(request, reply) {
        var story_id = request.params.id;
        var credentials = request.auth.credentials;

        Story.get_by_id(story_id, credentials.id, function(err, story) {
          if (err) {
            return reply(err);
          }

          story.remove(function(err) {
            if (err) {
              return reply(hjs.hapi.error.internal('Failed to save story to db: ' + story_id + ' err: ' + String(err)));
            }
            reply({
              success: true
            });
          });
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
  server.route({
    path: '/api/stories',
    method: 'POST',
    config: {
      validate: {
        payload: {
          title: Joi.string().max(100).required(),
          text: Joi.string(),
          location: Joi.object(),
          location_description: Joi.string(),
          publish: Joi.boolean(),
          tags: Joi.array()
        }
      },
      handler: function(request, reply) {
        var story = new Story(request.payload);
        story.author = request.auth.credentials.id;

        if (request.payload && request.payload.location && !GJV.isPoint(request.payload.location)) {
          return reply(hjs.hapi.error.badRequest('location is not valid geoJSON point.'));
        }

        story.save(function(err, db_story) {
          if (err) {
            return reply(hjs.hapi.error.badRequest('Failed to save: ' + String(err)));
          }
          reply(db_story.toJSON());
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
};
module.exports = StoryController;
