var Mbox    = require('../src/mbox');
var should  = require('should');
var fs      = require('fs');
var test    = function(parser, done) {
  var count     = 0; 
  var messages  = [];
  parser.on('message', function(msg) {
    count++;
    messages.push(msg);
  });
  parser.on('end', function() {
    count.should.equal(3);
    messages[0].length.should.equal(286);
    messages[1].length.should.equal(296);
    messages[2].length.should.equal(297);
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

  it('should parse an mbox file piped to it', function(done) {
    var stream  = fs.createReadStream(__dirname + '/test.mbox');
    var parser  = new Mbox();
    stream.pipe(parser);
    test(parser, done);
  });
});
