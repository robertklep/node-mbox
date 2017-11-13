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
    this.hasEnded     = false;
    this.message      = [];
    this.messageCount = 0;
    this.on('end', () => this.emitMessageIfPossible())
        .pipe(split('\n'))
        .on('data', line => {
          if (this.hasEnded) return;
          let postmark = line.toString().startsWith('From ');
          if (firstLine && ! postmark) {
            if (this.opts.strict === true) {
              this.emit('error', Error('NOT_AN_MBOX_FILE'))
            }
            this.hasEnded = true;
            this.end();
            return;
          }
          firstLine = false;
          if (postmark) {
            this.emitMessageIfPossible();
          }
          this.message.push(line);
        });
  }

  emitMessageIfPossible() {
    if (! this.message.length) return;
    this.messageCount++;
    this.emit('message', Buffer.concat(this.message));
    this.message = [];
  }
}
