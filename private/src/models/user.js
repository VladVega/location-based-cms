var lodash = require('lodash');

var userSchema = hjs.mongoose.Schema({
  display_name: {
    type: String
  },
  email: {
    type: String,
    required: true,
    index: {
      unique: true
    },
    match: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
  },
  login: {
    type: String,
    sparse: true
  },

  google_auth: Object,

  picture: String,

  bio: String,
  country: String,
  city_state_string: String,

  create_time: {
    type: String,
    default: new Date().toISOString()
  },
  last_login_time: {
    type: String,
    default: new Date().toISOString()
  }
});

userSchema.set('toJSON', {
  virtuals: true
});
userSchema.set('toObject', {
  virtuals: true
});

userSchema.methods = {
  getPublicView: function() {
    return lodash.pick(this.toJSON(),
      'display_name', 'picture', 'bio', 'city_state_string', 'country', 'id');
  }
};

var passwordValidation = /^(?=.*[a-zA-Z])\S{6,}$/;
//var passwordValidation=/^(?=.*[^a-zA-Z])(?=.*[a-zA-Z])\S{5,}$/; min 5 char, letters and numbers/signs

userSchema.statics = {
  get_list_update_fields: function() {
    return ['picture', 'display_name', 'bio', 'country', 'city_state_string'];
  },
  isPasswordValid: function(pw) {
    return pw ? passwordValidation.test(pw) : false;
  },
  //TODO change to HERE-code
  populateArray: function(arrUsers, cb) {
    this.find({
      _id: {
        $in: arrUsers
      }
    }).select('first_name last_name zoopcode_alias profile_pic bio self_tagged auto_tagged').exec(function(err, userObjects) {
      if (err) {
        return cb(err);
      }
      var jsonUsers = userObjects.map(function(userRaw) {
        return userRaw.toJSON();
      });
      cb(null, jsonUsers);
    });
  }
};
var User = hjs.mongoose.model('User', userSchema);

module.exports = User;
