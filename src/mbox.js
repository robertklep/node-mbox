const fs              = require('fs');
const { PassThrough } = require('stream');
const stringToStream  = require('string-to-stream');
const isStream        = require('isstream');
const split           = require('line-stream');

module.exports = class Mbox extends PassThrough {

  constructor(source, opts) {
    super();

    // Wait for `pipe` events.
    this.on('pipe', this.start.bind(this));

    // Determine source type.
    let stream;
    if (isStream(source)) {
      stream = source;
    } else if (typeof source === 'string' || Buffer.isBuffer(source)) {
      // May be a filename.
      if (fs.existsSync(source)) {
        stream = fs.createReadStream(source);
      } else {
        // Otherwise, treat as raw input.
        stream = stringToStream(source);
      }
    } else {
      this.opts = source || {};
      // Probably going to be piped to.
      return;
    }

    // Store options.
    this.opts = opts || {};

    // We have a stream, start splitting.
    stream.pipe(this);
  }

  start(stream) {
    let firstLine     = true;
    let streaming     = this.opts.stream === true;
    let msgStream     = null;
    let message       = [];
    this.messageCount = 0;

    let emit = () => {
      if (! message.length || streaming) return;
      this.messageCount++;
      this.emit('message', Buffer.concat(message));
      message = [];
    }

    this.on('end', () => {
      msgStream && msgStream.end();
      emit();
    }).pipe(split('\n')).on('data', line => {
      if (! this.writable) return;

      // Check for the `mbox` "post mark".
      let postmark = line.toString().startsWith('From ');

      // If this is the first line of the file, and it doesn't have
      // a post mark, it's not considered to be a (valid) mbox file.
      if (firstLine && ! postmark) {
        if (this.opts.strict === true) {
          this.emit('error', Error('NOT_AN_MBOX_FILE'))
        }
        this.end();
        if (msgStream) {
          msgStream.end();
        }
        return;
      }

      firstLine = false;
      if (streaming) {
        if (postmark) {
          msgStream && msgStream.end();
          msgStream = new PassThrough();
          this.emit('message', msgStream);
        }
        msgStream.write(line);
      } else {
        if (postmark) {
          emit();
        }
        message.push(line);
      }
    });
  }
}
