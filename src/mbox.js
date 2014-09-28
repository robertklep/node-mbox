var Readable      = require('stream').Readable;
var Transform     = require('stream').Transform;
var StreamSearch  = require('streamsearch');
var util          = require('util');
var fs            = require('fs');
var Stream        = require('stream');

util.inherits(StringReader, Readable);
util.inherits(MboxStream, Transform);

function StringReader(string) {
  // setup stream reader
  if (!(this instanceof StringReader))
    return new StringReader();
  Readable.call(this);
  this.string = string;
}

StringReader.prototype._read = function(size) {
  if (this.string.length === 0) {
    this.push(null);
  }
  else {
    this.push(this.string.slice(0, size));
    this.string = this.string.slice(size);
  }
};

function MboxStream(input, opts) {
  var stream = this;

  // handle arguments
  if (input !== undefined) {
    var klass   = input.constructor.name;
    var handle  = null;

    if (klass === 'String' || klass === 'Buffer') {
      // either filename...
      if (fs.existsSync(input))
        handle = fs.createReadStream(input);
      // ...or raw input string (handled by StringReader)
      else
        handle = new StringReader(input);
    }
    else
    if (klass === 'ReadStream')
      handle = input;
    else
    if (klass === 'Object')
      opts = input;

    if (handle) {
      // set encoding
      handle.setEncoding('ascii');

      // pipe handle to ourselves
      handle.pipe(this);
    }
  }

  // output encoding
  this.encoding = (opts && opts.encoding) ? opts.encoding : 'binary';

  // setup stream transformer
  if (!(this instanceof MboxStream)) {
    return new MboxStream(opts);
  }
  Transform.call(this, opts);

  // keep track of number of messages found
  this.number_of_messages = 0;

  // done
  var chunks = [];
  this.on('finish', function() {
    if (chunks.length) {
      stream.emit('message', chunks.join(''));
    }
    this.emit('end', stream.number_of_messages);
  });

  // setup stream searcher
  this.searcher = new StreamSearch('\nFrom ');
  this.searcher.on('info', function(isMatch, chunk, start, end) {
    if (chunk) {
      // Add needle.
      chunks.push( 'From ' + chunk.toString(stream.encoding, start, end) );
    }
    if (isMatch && chunks.length) {
      stream.number_of_messages++;
      stream.emit('message', chunks.join(''));
      chunks = [];
    }
  });

  // Push a dummy \n to the search so we match the first message.
  this.searcher.push('\n');
}

MboxStream.prototype._transform = function(chunk, encoding, done) {
  // Push chunks to the searcher.
  this.searcher.push(chunk);
  done();
};

module.exports = MboxStream;
