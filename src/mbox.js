'use strict';
const fs             = require('fs');
const PassThrough    = require('stream').PassThrough;
const stringToStream = require('string-to-stream');
const isStream       = require('isstream');
const split          = require('line-stream');
const POSTMARK       = Buffer.from('From ');

module.exports = class Mbox extends PassThrough {

  constructor(source, opts) {
    super();

    // Wait for `pipe` events.
    this.on('pipe', this.onPipe.bind(this));

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

  onPipe(stream) {
    let firstLine     = true;
    let streaming     = this.opts.stream === true;
    let msgStream     = null;
    let message       = [];
    this.messageCount = 0;

    let emit = () => {
      if (! message.length || streaming) return;
      this.messageCount++;
      let buffer = Buffer.concat(message);
      this.emit('message', this.opts.encoding ? buffer.toString(this.opts.encoding) : buffer);
      message = [];
    }

    // When input stream ends, emit any last messages;
    stream.on('end', () => {
      emit();
    });

    this.on('end', () => {
      msgStream && msgStream.end();
    }).pipe(split('\n')).on('data', line => {
      if (! this.writable) return;

      // Check for the `mbox` "post mark" (`From `).
      let hasPostmark = line[0] === POSTMARK[0] &&
                        line[1] === POSTMARK[1] &&
                        line[2] === POSTMARK[2] &&
                        line[3] === POSTMARK[3] &&
                        line[4] === POSTMARK[4];

      // If this is the first line of the file, and it doesn't have
      // a post mark, it's not considered to be a (valid) mbox file.
      if (firstLine && ! hasPostmark) {
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
        if (hasPostmark) {
          msgStream && msgStream.end();
          msgStream = new PassThrough();
          this.emit('message', msgStream);
        }
        msgStream.write(line);
      } else {
        if (hasPostmark) {
          emit();
        }
        message.push(line);
      }
    });
  }
}
