var Readable    = require('stream').Readable;
var Transform   = require('stream').Transform;
var util        = require('util');
var fs          = require('fs');
var Stream      = require('stream');

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
      throw Error('Unknown input type for mbox constructor');

    // set encoding
    handle.setEncoding('ascii');

    // pipe handle to ourselves
    handle.pipe(this);
  }

  // setup stream transformer
  if (!(this instanceof MboxStream))
    return new MboxStream(opts);
  Transform.call(this, opts);

  // handle 'finish' event.
  this.on('finish', function() {
    this.findMessages(true);
    this.emit('end');
  });

  // buffer to contain data read so-far (the '\n' is a shortcut so we can match
  // against '\nFrom ' separators even for the first message in the mbox file).
  this.buffer = '\n';
}

MboxStream.prototype.findMessages = function(EOF) {
  // find start of message
  var start = this.buffer.indexOf('\nFrom ');

  // continue while we're finding message in the current buffer
  while (start !== -1) {
    // find end of message
    var end = this.buffer.indexOf('\nFrom ', start + 1);

    // end wasn't found?
    if (end === -1) {
      // if we hit the end of the file, assume the buffer contains the rest
      // of the current message.
      if (EOF)
        end = this.buffer.length;
      else
        // otherwise, just quit processing.
        break;
    }

    // pluck message from buffer and emit event
    var message = this.buffer.substring(start + 1, end);
    this.emit('message', message);

    // adjust buffer so the message is removed
    this.buffer = this.buffer.substring(0, start) + this.buffer.substring(end);

    // let's try if we can find another message
    start = this.buffer.indexOf('\nFrom ');
  }
};

MboxStream.prototype._transform = function(chunk, encoding, done) {
  this.buffer += chunk;
  this.findMessages();
  done();
};

module.exports = MboxStream;
