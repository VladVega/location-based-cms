/* jshint -W020 */
//Single global variable.
hjs = require('./services/global.js');

var port = process.env.PORT || hjs.config.get('server.port');
console.log('Server config =', hjs.config.get('server.host') + ':' + Number(port));
var server_options = {
  cors: true,
  debug: {
      // request: ["received"]
  },
  views: {
    engines: {
      html: require('ejs')
    },
    path: 'public/views',
    isCached: !hjs.isDev()
  }
};
var server = require('hapi').createServer(
  hjs.config.get('server.host'),
  Number(port), server_options
);

hjs.mongoose.connect(hjs.config.get('databases.domain.uri'));
hjs.mongoose.connection.on('error', function(err) {
  hjs.handle_error.init(err, 'Domain Database Mongoose');
});

//API SETUP
var authentication = require('./services/authentication');
hjs.async.series([

  function add_authentication(async_cb) {
    authentication.setup(server, async_cb);
  },
  function add_docs(async_cb) {
    server.pack.register(require('lout'), async_cb);
  },
  function open_routes(async_cb) {
    require('./controllers/web')(server);
    require('./controllers/user')(server);
    require('./controllers/story')(server);
    require('./controllers/media')(server);
    async_cb();
  },
  function start_server(async_cb) {
    if (module.parent) {
      return async_cb();
    }
    server.start(function(err) {
      if (err) {
        return async_cb(err);
      }
      console.log('Hapi server started successfully.');
      async_cb();
    });
  }
], function(err) {
  if (err) {
    return hjs.handle_error.init(err);
  }
  console.log('Server Setup Complete.');
});

module.exports = server;
