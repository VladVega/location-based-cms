var lodash = require('lodash');
var fs = require('fs');

var WebController = function(server) {
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'public',
        index: true
      }
    }
  });

  //VIEWS
  server.route({
    path: "/{view_name?}",
    method: "GET",
    config: {
      handler: function view_handler(request, reply) {
        var view_name = request.params.view_name || 'index';
        //TODO figure out a better way to validate?
        fs.exists(__dirname + '/../../../public/views/' + view_name + '.html', function(exists) {
          if (!exists) {
            return reply(hjs.hapi.error.notFound('This view was not found: ' + view_name));
          }
          reply.view(view_name, {
            current_user_id: lodash.isObject(request.auth.credentials) ? request.auth.credentials.id : ''
          });
        });
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    }
  });

  server.route({
    path: "/test/{view_name?}",
    method: "GET",
    config: {
      handler: function view_handler(request, reply) {
        var view_name = request.params.view_name || 'index';
        //TODO figure out a better way to validate?
        fs.exists(__dirname + '/../../../public/test/views/' + view_name + '.html', function(exists) {
          if (!exists) {
            return reply(hjs.hapi.error.notFound('This view was not found: ' + view_name));
          }
          reply.view('test/' + view_name, {
            current_user_id: lodash.isObject(request.auth.credentials) ? request.auth.credentials.id : ''
          });
        });
      },
      auth: {
        mode: 'try',
        strategy: 'session'
      }
    }
  });
};
module.exports = WebController;
