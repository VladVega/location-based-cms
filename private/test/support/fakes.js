var fakes = {
  credentials: function() {
    return {
      google_auth: {
        token: "ya29.UAD0b2Q71PoHzSEAAACJRG2NXa1lkHJe_Qm8vcaXqZXoSZb8XKStgi-4HXgaMxWevmtK-xxPmp6Pd3GvIcY",
        id: "106199577530683590683"
      },
      picture: "https://lh3.googleusercontent.com/-mPH8LK9IFGk/AAAAAAAAAAI/AAAAAAAABPk/tvrNmeFmBeg/photo.jpg",
      email: "vlad.b.vega@gmail.com",
      display_name: "Vlad Vega",
      _id: "53d5ceb0db17ff4f2256a06b",
      __v: 0,
      last_login_time: "2014-07-28T04:16:29.209Z",
      create_time: "2014-07-28T04:16:29.209Z",
      id: "53d5ceb0db17ff4f2256a06b"
    };
  },
  credentials2: function() {
    return {
      "google_auth": {
        "token": "ya29.YwBgKdbZiFV60SEAAAAAFcWYsPcrmA85d14OWv3mJIo7QSh72pumJlsYI-Q3Nd3cKCszN35C7Y7Uq1_Y8nQ",
        "id": "104059518502893028878"
      },
      "picture": "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg",
      "email": "vbukhin@gmail.com",
      "display_name": "Vladimir Bukhin",
      "_id": {
        "$oid": "53efe2558391dad76d1ad267"
      },
      "last_login_time": "2014-08-16T22:59:11.529Z",
      "create_time": "2014-08-16T22:59:11.529Z",
      "__v": 0,
      id: "53efe2558391dad76d1ad267"
    };
  },
  real_story_id: function() {
    return '53e237d33de3fc8d4410e47a';
  },
  mongo_id: function() {
    return "53d5ceb0db17ff4f2256a06c";
  },
  mongo_id2: function() {
    return "53d5ceb0db17ff4f2256a06d";
  },
  multipart_content: function(mime_type, ext) {
    var multipart_content = '--AaB03x\r\n' +
      'content-disposition: form-data; name="content"; filename="test.' + ext + '"\r\n';

    if (mime_type) {
      multipart_content += 'Content-Type: ' + mime_type + '\r\n';
    }

    multipart_content += '\r\n' +
      '... contents of file ...\r\r\n' +
      '--AaB03x--\r\n';

    return multipart_content;
  }
};
module.exports = fakes;
