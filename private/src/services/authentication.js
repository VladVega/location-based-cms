var User = require('../models/user.js');

var authentication = {
  setup: function(server, cb) {
    server.pack.register([{
      plugin: require('bell')
    }, {
      plugin: require('hapi-auth-cookie')
    }], function(err) {
      if (err) {
        hjs.handle_error.init(err, 'passport auth');
      }

      //TODO persist session over multiple processes
      server.auth.strategy('session', 'cookie', {
        password: 'here_is_my_secret', // cookie secret
        cookie: 'hid', // Cookie name
        redirectTo: false, // Let's handle our own redirections
        isSecure: false, // required for non-https applications
        ttl: 24 * 60 * 60 * 1000 // Set session to 1 day
      });

      // Declare an authentication strategy using the bell scheme
      // with the name of the provider, cookie encryption password,
      // and the OAuth client credentials.
      server.auth.strategy('google', 'bell', {
        provider: 'google',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        password: 'cookie_pw_here_4545',
        clientId: hjs.config.get('api_credentials.google.client_id'),
        clientSecret: hjs.config.get('api_credentials.google.client_secret'),
        isSecure: false // Terrible idea but required if not using HTTPS
      });

      // Use the 'twitter' authentication strategy to protect the
      // endpoint handling the incoming authentication credentials.
      // This endpoints usually looks up the third party account in
      // the database and sets some application state (cookie) with
      // the local application account information.
      server.route({
        method: ['GET', 'POST'], // Must handle both GET and POST
        path: '/login', // The callback endpoint registered with the provider
        config: {
          auth: 'google',
          handler: function(request, reply) {
            if (!request.auth.isAuthenticated) {
              return reply('Authentication failed due to: ' + request.auth.error.message);
            }

            var credentials = request.auth.credentials;

            User.findOne({
              email: credentials.profile.email
            }, function(err, db_user) {
              if (err) {
                return request.log(['auth'], 'error finding user after google auth:');
              }
              var user = db_user || new User();
              user.display_name = credentials.profile.displayName;
              user.email = credentials.profile.email;
              user.picture = credentials.profile.raw.picture;
              user.google_auth = {
                id: credentials.profile.id,
                token: credentials.token
              };
              user.save(function(err, user) {
                if (err) {
                  return request.log(['auth'], 'error saving user after google auth:');
                }
                request.auth.session.set(user.toJSON());
                reply.redirect('/');
              });
            });
          }
        }
      });
      cb();
    });
  }
};
module.exports = authentication;
