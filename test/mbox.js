var Mbox     = require('../src/mbox');
var assert   = require('assert');
var fs       = require('fs');
var through2 = require('through2');
var test     = function(parser, expectCount, done) {
  var count    = 0;
  var messages = [];
  var errored  = false;

  parser.on('error', function(err) {
    errored = true;
    done(err);
  });

  parser.on('message', function(msg) {
    count++;
    messages.push(msg);
  });

  parser.on('end', function(num) {
    if (errored) return;
    count.should.equal(expectCount);
    num.should.equal(count);
    if (expectCount === 0) {
      return done();
    }
    if (expectCount >= 1) {
      messages[0].length.should.equal(286);
    }
    if (expectCount >= 2) {
      messages[1].length.should.equal(296);
    }
    if (expectCount >= 3) {
      messages[2].length.should.equal(296);
    }
    if (expectCount >= 4) {
      messages[3].length.should.equal(296);
    }
    done();
  });
};

var FILES = [
  [ 'Empty file',                  'test-0-message.mbox', 0 ],
  [ 'Containing 1 message',        'test-1-message.mbox', 1 ],
  [ 'Containing 2 messages',       'test-2-message.mbox', 2 ],
  [ 'Containing 3 messages',       'test-3-message.mbox', 3 ],
  [ 'Containing 4 messages',       'test-4-message.mbox', 4 ],
  [ 'Invalid, with mbox attached', 'test-attached.mbox',  0 ],
];

describe('parser', function() {

  FILES.forEach(function(data) {
    var testName     = data[0];
    var fileName     = __dirname + '/' + data[1];
    var messageCount = data[2];

    describe(testName, function() {

      it('as a filename', function(done) {
        test(new Mbox(fileName), messageCount, done);
      });

      it('as a string', function(done) {
        var mailbox = fs.readFileSync(fileName);
        test(new Mbox(mailbox), messageCount, done);
      });

      it('as a stream', function(done) {
        var stream = fs.createReadStream(fileName);
        test(new Mbox(stream), messageCount, done);
      });

      it('as a through2 stream', function(done) {
        var stream        = fs.createReadStream(fileName);
        var throughstream = through2();
        stream.pipe(throughstream);
        test(new Mbox(throughstream), messageCount, done);
      });

      it('piped', function(done) {
        var stream  = fs.createReadStream(fileName);
        var parser  = new Mbox();
        stream.pipe(parser);
        test(parser, messageCount, done);
      });
    });

  });

  describe('Strict mode', function() {

    it('should throw an error in strict mode when a file isn\'t an mbox file', function(done) {
      test(new Mbox(__dirname + '/test-not-an.mbox', { strict : true }), 0, function(err) {
        assert(err);
        assert(err.message, 'NOT_AN_MBOX_FILE');
        done();
      });
    });

    it('should throw an error in strict mode when a file isn\'t an mbox file (but has one attached)', function(done) {
      test(new Mbox(__dirname + '/test-0-message.mbox', { strict : true }), 0, function(err) {
        assert.ifError(err);
        done();
      });
    });

    it('should not throw an error in strict mode when a file is empty', function(done) {
      test(new Mbox(__dirname + '/test-0-message.mbox', { strict : true }), 0, function(err) {
        assert.ifError(err);
        done();
      });
    });

  });
});
