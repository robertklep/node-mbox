const {Mbox, MboxStream} = require('../src/mbox');

const assert     = require('assert');
const { expect } = require('chai');
const fs         = require('fs');
const split                 = require('line-stream');

const test = function(parser, expectCount, headerP, done) {
  let count    = 0;
  let messages = [];
  let errored  = false;

  parser.on('data', (msg) => {
    count++;
    messages.push(msg);
  });


  parser.on('error', function(err) {
    errored = err;
    done(err);
  });

  parser.on('finish', function() {
    if (errored) {
      done();
      return;
    }

    expect(messages.length).to.equal(expectCount);

    if (expectCount === 0) {
      return done();
    }

    messages.forEach((message, index) => {
      let expected = index === 0 ? 297 :
                     index === 1 ? 298 :
                     index === 2 ? 299 : 300;
      expect(message).to.have.length(expected - (headerP ? 0 : Buffer.byteLength("From abc@gmail.com Sun Dec 25 21:33:37 2011\n")));
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

  FILES.slice(0, -1).forEach(function(data) {
    let testName     = data[0];
    let fileName     = __dirname + '/' + data[1];
    let messageCount = data[2];

    describe(testName, function() {
      it('as a stream without header', function(done) {
        let fstream = fs.createReadStream(fileName);
        test(
          fstream
            .pipe(split('\n'))
            .pipe(new Mbox()), messageCount, false, done);
      });

      it('as a stream with header', function(done) {
        let fstream = fs.createReadStream(fileName);
        test(
          fstream
            .pipe(split('\n'))
            .pipe(new Mbox({includeMboxHeader: true})), messageCount, true, done);
      });


    });

  });

  describe('Strict mode', function() {
    it('should throw an error in strict mode when a file isn\'t an mbox file', function(done) {
      test(fs.createReadStream(__dirname + '/test-not-an.mbox').pipe(MboxStream()), 0, false, function(err) {
        assert(err);
        assert(err.message, 'NOT_AN_MBOX_FILE');
        done();
      });
    });

    it('should throw an error in strict mode when a file isn\'t an mbox file (but has one attached)', function(done) {
      test(fs.createReadStream(__dirname + '/test-attached.mbox').pipe(MboxStream()), 0, false, function(err) {
        assert(err);
        assert(err.message, 'NOT_AN_MBOX_FILE');
        done();
      });
    });

    it('should not throw an error in strict mode when a file is empty', function(done) {
      test(fs.createReadStream(__dirname + '/test-0-message.mbox').pipe(MboxStream()), 0, false, function(err) {
        assert.ifError(err);
        done();
      });
    });
  });
});
