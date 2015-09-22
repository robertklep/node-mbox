var Mbox     = require('../src/mbox');
var fs       = require('fs');
var through2 = require('through2');
var test     = function(parser, done) {
  var count     = 0;
  var messages  = [];
  parser.on('message', function(msg) {
    count++;
    messages.push(msg);
  });
  parser.on('end', function(num) {
    count.should.equal(3);
    num.should.equal(count);
    messages[0].length.should.equal(286);
    messages[1].length.should.equal(296);
    messages[2].length.should.equal(296);
    done();
  });
};

describe('parser', function() {
  it('should parse an mbox file passed as file', function(done) {
    test(new Mbox(__dirname + '/test.mbox'), done);
  });

  it('should parse an mbox file passed as string', function(done) {
    var mailbox = fs.readFileSync(__dirname + '/test.mbox');
    test(new Mbox(mailbox), done);
  });

  it('should parse an mbox file passed as stream', function(done) {
    var stream = fs.createReadStream(__dirname + '/test.mbox');
    test(new Mbox(stream), done);
  });

  it('should parse an mbox file passed as through2 stream', function(done) {
    var stream        = fs.createReadStream(__dirname + '/test.mbox');
    var throughstream = through2();
    stream.pipe(throughstream);
    test(new Mbox(throughstream), done);
  });

  it('should parse an mbox file piped to it', function(done) {
    var stream  = fs.createReadStream(__dirname + '/test.mbox');
    var parser  = new Mbox();
    stream.pipe(parser);
    test(parser, done);
  });
});
