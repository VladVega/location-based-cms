var mongoose = require('mongoose');
var GJV = require("geojson-validation");
var lodash = require('lodash');

var storySchema = mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  create_time: {
    type: String,
    default: new Date().toISOString()
  },
  last_edit_date: {
    type: String,
    default: new Date().toISOString()
  },
  first_published_time: {
    type: String
  },
  publish: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  text: String,
  media: {
    type: Array,
    default: []
  },
  location: {
    type: Object,
    index: '2dsphere'
  },
  location_description: String,
  tags: Array
});

storySchema.virtual('image').get(function () {
  return lodash.findWhere(this.media, {type: 'image'});
});

storySchema.set('toJSON', {
  virtuals: true
});
storySchema.set('toObject', {
  virtuals: true
});

storySchema.pre('save', function(next) {
  if ((this.publish === true || this.publish === 'true') && !this.first_published_time) {
    this.first_published_time = new Date().toISOString();
  }

  if (this.location && !GJV.isPoint(this.location)) {
    return next(hjs.hapi.error.badRequest('Location is not in the proper format.'));
  }

  this.last_edit_date = new Date().toISOString();

  next();
});

storySchema.methods = {
  get_list_view: function() {
    return lodash.pick(this.toJSON(), 'id', 'author',
      'create_time', 'location', 'location_description', 'tags', 'image', 'title');
  }
};

storySchema.statics = {
  get_list_update_fields: function() {
    return ['title', 'text', 'location', 'location_description', 'tags'];
  },
  get_by_id: function(story_id, current_user_id, cb) {
    this.findById(story_id, function(err, story) {
      if (err) {
        return cb(hjs.hapi.error.internal('Failed to retrieve story information from db: ' + story_id + ' err: ' + String(err)));
      }
      if (!story) {
        return cb(hjs.hapi.error.notFound('Could not find story by id:' + story_id));
      }
      if (current_user_id && story.author != current_user_id) {
        return cb(hjs.hapi.error.forbidden('You are not authorized to update this story: ' + story_id));
      }
      cb(null, story);
    });
  }
};

module.exports = mongoose.model('Story', storySchema);
