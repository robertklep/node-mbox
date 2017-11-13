const Mbox       = require('../src/mbox');
const assert     = require('assert');
const { expect } = require('chai');
const fs         = require('fs');
const through2   = require('through2');

const test = function(parser, expectCount, done) {
  let count    = 0;
  let messages = [];
  let errored  = false;

  parser.on('error', function(err) {
    errored = err;
    done(err);
  });

  parser.on('message', function(msg) {
    count++;
    messages.push(msg);
  });

  parser.on('end', function() {
    if (errored) return;
    expect(count).to.equal(expectCount);
    expect(parser.messageCount).to.equal(count);
    if (expectCount === 0) {
      return done();
    }
    messages.forEach((message, index) => {
      let expected = index === 0 ? 297 :
                     index === 1 ? 298 :
                     index === 2 ? 299 : 300;
      expect(message).to.have.length(expected);
    });
    done();
  });
};

const FILES = [
  [ 'Empty file',                  'test-0-message.mbox', 0 ],
  [ 'Containing 1 message',        'test-1-message.mbox', 1 ],
  [ 'Containing 2 messages',       'test-2-message.mbox', 2 ],
  [ 'Containing 3 messages',       'test-3-message.mbox', 3 ],
  [ 'Containing 4 messages',       'test-4-message.mbox', 4 ],
  [ 'Invalid, with mbox attached', 'test-attached.mbox',  0 ],
];

describe('parser', function() {

  FILES.forEach(function(data) {
    let testName     = data[0];
    let fileName     = __dirname + '/' + data[1];
    let messageCount = data[2];

    describe(testName, function() {

      it('as a filename', function(done) {
        test(new Mbox(fileName), messageCount, done);
      });

      it('as a string', function(done) {
        let mailbox = fs.readFileSync(fileName);
        test(new Mbox(mailbox), messageCount, done);
      });

      it('as a stream', function(done) {
        let stream = fs.createReadStream(fileName);
        test(new Mbox(stream), messageCount, done);
      });

      it('as a through2 stream', function(done) {
        let stream        = fs.createReadStream(fileName);
        let throughstream = through2();
        stream.pipe(throughstream);
        test(new Mbox(throughstream), messageCount, done);
      });

      it('piped', function(done) {
        let stream  = fs.createReadStream(fileName);
        let parser  = new Mbox();
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
      test(new Mbox(__dirname + '/test-attached.mbox', { strict : true }), 0, function(err) {
        assert(err);
        assert(err.message, 'NOT_AN_MBOX_FILE');
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
