var Readable      = require('stream').Readable;
var Transform     = require('stream').Transform;
var StreamSearch  = require('streamsearch');
var util          = require('util');
var fs            = require('fs');
var Stream        = require('stream');
var isStream      = require('isstream');

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
      if (fs.existsSync(input)) {
        handle = fs.createReadStream(input);
      } else {
        // ...or raw input string (handled by StringReader)
        handle = new StringReader(input);
      }
    } else if (isStream(input)) {
      handle = input;
    } else if (klass === 'Object') {
      opts = input;
    }

    if (handle) {
      // set encoding
      handle.setEncoding('ascii');

      // pipe handle to ourselves
      handle.pipe(this);
    }
  }

  // strict mode throws an error when a file doesn't look like an mbox file.
  this.strictMode = opts && opts.strict === true;

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
  var chunks  = [];
  var matches = 0;
  this.on('finish', function() {
    if (matches) {
      stream.number_of_messages++;
      // Add the needle back in when emitting
      stream.emit('message', 'From ' + chunks.join(''));
    }
    this.emit('end', stream.number_of_messages);
  });

  // setup stream searcher
  this.searcher = new StreamSearch('\nFrom ');
  this.searcher.on('info', function(isMatch, chunk, start, end) {
    if (chunk) {
      chunk = chunk.toString(stream.encoding, start, end);
      chunks.push(chunk);
    }
    if (isMatch) {
      matches++;
      // Add the needle back in when emitting
      if (chunks.length) {
        stream.number_of_messages++;
        stream.emit('message', 'From ' + chunks.join(''));
        chunks = [];
      }
    }
  });

  // Push a dummy \n to the search so we match the first message.
  this.searcher.push('\n');
}

MboxStream.prototype._transform = function(chunk, encoding, done) {
  if (! this.parsedHeader) {
    this.parsedHeader = true;
    if (chunk.indexOf('From ') !== 0) {
      if (this.strictMode) return done(new Error('NOT_AN_MBOX_FILE'));
      return this.emit('finish');
    }
  }
  // Push chunks to the searcher.
  this.searcher.push(chunk);
  done();
};

module.exports = MboxStream;
