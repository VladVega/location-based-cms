/*
Global object
 */

var lodash = require('lodash');

var global_obj = {
  config: require('config'),
  async: require('async'),
  mongoose: require('mongoose'),
  hapi: require('hapi'),
  validate_mongo_id: function(arr_params) {
    return function(value, options, next) {
      for (var i = 0; i < arr_params.length; i++) {
        if (!hjs.mongoose.Types.ObjectId.isValid(value[arr_params[i]])) {
          return next(hjs.hapi.error.badRequest('Story Id is not valid.'));
        }
      }
      next(null, value);
    };
  },
  isDev: function() {
    return ['prod', 'stage'].indexOf(process.env.NODE_ENV)  < 0;
  },
  handle_error: {
    init: function handle_error_init(err, thing_that_failed) {
      if (err) {
        console.log(thing_that_failed + ' connection start error');
        console.dir(err);
        process.exit(0);
      }
    },
    log: function(err, msg, state) {
      if (!lodash.isObject(err)) {
        err = new Error(msg);
      }
      err.msg_when_logging = msg;
      err.state = state;
      global_obj.log('ERROR: ', err);
    }
  },
  //TODO this is not used yet. Need to define logging strategy
  log: function(label, content) {
    if (lodash.isObject(content) || lodash.isArray(content)) {
      content.label = label;
      console.log(label, content);
    } else {
      console.log(label);
    }
  }
};

module.exports = global_obj;
