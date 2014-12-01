var cloudinary = require('cloudinary');
var pkgcloud = require('pkgcloud');
var lodash = require('lodash');

cloudinary.config(hjs.config.get('cloudinary'));
var cloudFiles = pkgcloud.storage.createClient(hjs.config.get('cloudfiles.credentials'));
var cloudFiles_container = hjs.config.get('cloudfiles.container');

var list_of_accepted_mime_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'audio/x-aac', 'audio/aac',
  'audio/wav', 'audio/x-wav', 'audio/mpeg3', 'audio/x-mpeg-3', 'video/quicktime', 'video/mp4', 'audio/mpeg', 'audio/mp3'
];

var mediaSchema = hjs.mongoose.Schema({
  mime_type: {
    type: String,
    require: true,
    enum: list_of_accepted_mime_types
  },
  filename: {
    type: String,
    require: true
  },
  type: {
    type: String,
    require: true
  },
  title: String,
  description: String,
  create_time: {
    type: String,
    default: new Date().toISOString()
  },
  storage_id: {
    type: String,
    require: true
  },
  storage_type: {
    type: String,
    require: true
  }
});

mediaSchema.set('toJSON', {
  virtuals: true
});
mediaSchema.set('toObject', {
  virtuals: true
});

mediaSchema.methods = {
  configure_storage_type: function(story_id) {
    if (list_of_accepted_mime_types.indexOf(this.mime_type) < 0) {
      return 'mime type is not accepted: ' + this.mime_type;
    }
    this.type = this.mime_type.split('/')[0];
    this.storage_id = story_id + "/" + this.filename;

    if (this.type == 'image') {
      this.storage_type = 'cloudinary';
    } else {
      this.storage_type = 'cloudfiles';
    }
  },
  save_binary: function(filestream, cb) {
    var self = this;
    if (this.storage_type == 'cloudinary') {
      var cloudinary_stream = cloudinary.uploader.upload_stream(function(result) {
        if (result.error) {
          return cb(result.error.message);
        }
        cb(null, self.toJSON());
      }, {
        public_id: self.storage_id
      });
      filestream.on('data', cloudinary_stream.write).on('end', cloudinary_stream.end);
    } else {
      var cloudFilesStream = cloudFiles.upload({
        container: cloudFiles_container,
        remote: self.storage_id
      }, function(err) {
        if (err) {
          return cb('Couldn\'t save file into cloudfiles: ' + String(err));
        }
        cb(null, self.toJSON());
      });
      filestream.pipe(cloudFilesStream);
    }
  }
};

mediaSchema.statics = {
  get_meta_fields_list: function() {
    return ["description", "title"];
  },
  delete_one: function(story_model, media_id, cb) {
    var media_to_delete = lodash.findWhere(story_model.media, {
      id: media_id
    });
    if (!media_to_delete) {
      return cb('Could not find the media object that is being deleted: ' + media_id);
    }
    if (media_to_delete.storage_type == 'cloudfiles') {
      cloudFiles.removeFile(cloudFiles_container, media_to_delete.storage_id, function(err) {
        if (err) {
          hjs.handle_error.log(err, 'could not delete file', media_to_delete);
        }
      });
    } else if (media_to_delete.storage_type == 'cloudinary') {
      cloudinary.api.delete_resources([media_to_delete.storage_id], function(err) {
        if (err) {
          hjs.handle_error.log(err, 'could not delete image', media_to_delete);
        }
      });
    }

    story_model.media = lodash.reject(story_model.media, function(mediaObj) {
      return mediaObj.id == media_id;
    });
    story_model.save(function(err, db_story) {
      if (err) {
        return cb(err);
      }
      cb(null, db_story.toJSON());
    });
  }
};
var Media = hjs.mongoose.model('Media', mediaSchema);

module.exports = Media;
