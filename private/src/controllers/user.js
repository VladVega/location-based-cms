var User = require('../models/user.js');
var lodash = require('lodash');

var list_of_acceptable_update_fields = User.get_list_update_fields();

var UserController = function(server) {
  server.route({
    path: '/api/users/{id}',
    method: 'GET',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['id'])
      },
      handler: function(request, reply) {
        var uid = request.params.id;

        var credentials = request.auth.credentials;
        if (lodash.isObject(credentials) && credentials.id && credentials.id == uid) {
          return reply(credentials);
        }

        User.findById(uid, function(err, db_user) {
          if (err) {
            return reply(hjs.hapi.error.internal('Failed to retrieve user information from db.'));
          }
          if (!db_user) {
            return reply(hjs.hapi.error.notFound('Could not find user by id:' + uid));
          }
          reply(db_user.getPublicView());
        });
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    }
  });
  server.route({
    path: '/api/users/{id}',
    method: 'PUT',
    config: {
      validate: {
        params: hjs.validate_mongo_id(['id']),
        payload: function(value, options, next) {
          var payload_with_only_accepted_fields = lodash.pick(value, list_of_acceptable_update_fields);
          if (!lodash.keys(payload_with_only_accepted_fields).length) {
            return next(hjs.hapi.error.badRequest('No acceptable fields were found in the request. ' +
              'List of acceptable fields: ' + list_of_acceptable_update_fields.toString()));
          }
          next(null, payload_with_only_accepted_fields);
        }
      },
      handler: function(request, reply) {
        var uid = request.params.id;

        var credentials = request.auth.credentials;
        if (!(lodash.isObject(credentials) && credentials.id && credentials.id == uid)) {
          return reply(hjs.hapi.error.forbidden('You are not authorized to update this user\'s profile: ' + uid));
        }

        User.findByIdAndUpdate(uid, request.payload, function(err, db_user) {
          if (err) {
            return reply(hjs.hapi.error.badRequest('Failed to save: ' + String(err)));
          }
          reply(db_user.toJSON());
        });
      },
      auth: {
        strategy: 'session'
      }
    }
  });
};
module.exports = UserController;
