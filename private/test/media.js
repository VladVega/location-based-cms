var server = require('../src/app');
var Lab = require("lab");
var assert = require('assert');
var support = require('./support');

Lab.experiment('MEDIA API', function() {
  var story_created_by_self_id;

  Lab.before(function(done) {
    support.helpers.add_story(support.fakes.credentials().id, null, function(id_s) {
      story_created_by_self_id = id_s;
      done();
    });
  });
  Lab.after(function(done) {
    support.helpers.delete_all_stories(done);
  });

  Lab.experiment('POST /api/stories/{story_id}/media', function() {
    Lab.test('errors since content type is not acceptable', function(done) {
      var options = {
        method: "POST",
        url: "/api/stories/" + story_created_by_self_id + '/media',
        credentials: support.fakes.credentials(),
        payload: support.fakes.multipart_content('text/plain', 'txt'),
        headers: {
          'content-type': 'multipart/form-data; boundary=AaB03x'
        }
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(400);
        assert.equal(response.result.message, 'mime type is not accepted: text/plain');
        done();
      });
    });

    Lab.test('errors without content type', function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "POST",
        url: "/api/stories/" + story_created_by_self_id + '/media',
        credentials: creds,
        payload: support.fakes.multipart_content('', 'txt'),
        headers: {
          'content-type': 'multipart/form-data; boundary=AaB03x'
        }
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(400);
        assert.equal(response.result.message, 'Content-type is not present.');
        done();
      });
    });

    Lab.test('errors when content type is image but content is not', function(done) {
      var options = {
        method: "POST",
        url: "/api/stories/" + story_created_by_self_id + '/media',
        credentials: support.fakes.credentials(),
        payload: support.fakes.multipart_content('image/png', 'png'),
        headers: {
          'content-type': 'multipart/form-data; boundary=AaB03x'
        }
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(400);
        assert.equal(response.result.message, 'Invalid image file');
        done();
      });
    });

    Lab.test('successfully saves media content', function(done) {
      var creds = support.fakes.credentials();

      var options = {
        method: "POST",
        url: "/api/stories/" + story_created_by_self_id + '/media',
        credentials: creds,
        payload: support.fakes.multipart_content('video/mp4', 'mp4'),
        headers: {
          'content-type': 'multipart/form-data; boundary=AaB03x'
        }
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(200);
        assert(response.result.author);
        var mediaArr = response.result.media;
        assert(Array.isArray(mediaArr));
        assert.equal(mediaArr.length, 1);
        var single_media = mediaArr[mediaArr.length - 1];
        assert.equal(single_media.storage_type, 'cloudfiles');
        done();
      });
    });
  });
  Lab.experiment('DELETE /api/stories/{story_id}/media/{media_id}', function() {
    var saved_media_id;
    Lab.before(function(done) {
      var options = {
        method: "POST",
        url: "/api/stories/" + story_created_by_self_id + '/media',
        credentials: support.fakes.credentials(),
        payload: support.fakes.multipart_content('video/mp4', 'mp4'),
        headers: {
          'content-type': 'multipart/form-data; boundary=AaB03x'
        }
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(200);
        var mediaArr = response.result.media;
        saved_media_id = mediaArr[mediaArr.length - 1].id;
        done();
      });
    });

    Lab.test('error with story_id', function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/wrong_id/media/" + saved_media_id,
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });

    Lab.test('error with media_id', function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/" + story_created_by_self_id + "/media/wrong_id",
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert.equal(result.error, 'Bad Request');
        done();
      });
    });

    Lab.test('error media id not in story', function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/" + story_created_by_self_id + "/media/" + support.fakes.mongo_id(),
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 400);
        assert(result.message.indexOf('Could not find the media object') >= 0);
        done();
      });
    });

    Lab.test('story doesnt exist', function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/" + support.fakes.mongo_id2() + "/media/" + support.fakes.mongo_id(),
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 404);
        assert.equal(result.error, 'Not Found');
        done();
      });
    });

    Lab.test('deletes successfully', function(done) {
      var options = {
        method: "DELETE",
        url: "/api/stories/" + story_created_by_self_id + "/media/" + saved_media_id,
        credentials: support.fakes.credentials()
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(200);
        assert(response.result.author);
        var mediaArr = response.result.media;
        assert(Array.isArray(mediaArr));
        mediaArr.forEach(function(media) {
          assert.notEqual(media.id, saved_media_id);
        });
        done();
      });
    });
  });
});
