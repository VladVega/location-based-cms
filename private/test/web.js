var server = require('../src/app');
var Lab = require("lab");
var assert = require('assert');
var support = require('./support');

Lab.experiment('WEB VIEW API', function() {
  Lab.experiment('GET /{view_name}', function() {
    Lab.test("retrieves index", function(done) {
      var options = {
        method: "GET",
        url: "/"
      };

      server.inject(options, function(response) {
        var result = response.result;
        Lab.expect(response.statusCode).to.equal(200);
        assert(/html>/.test(result));
        assert(/html/.test(response.headers["content-type"]));
        done();
      });
    });
    Lab.test("retrieves about view", function(done) {
      var options = {
        method: "GET",
        url: "/about"
      };

      server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(200);
        assert(/html/.test(response.headers["content-type"]));
        done();
      });
    });
    Lab.test("Not found error when view does not exist.", function(done) {
      var options = {
        method: "GET",
        url: "/non_view_name"
      };

      server.inject(options, function(response) {
        var result = response.result;
        assert.equal(response.statusCode, 404);
        assert.equal(result.error, 'Not Found');
        done();
      });
    });
  });
});
