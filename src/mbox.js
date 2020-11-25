'use strict';
const fs             = require('fs');
const {PassThrough,
  Transform}         = require('stream');
const stringToStream = require('string-to-stream');
const isStream       = require('isstream');
const split          = require('line-stream');
const POSTMARK       = Buffer.from('From ');

module.exports = class Mbox extends Transform {
  constructor(opts) {
    this.opts = opts || {};
    this.firstLine = true;
    this.message = [];
    this.messageCount = 0;

    super();

    this.lineSplitter = split('\n');
  }

  /* data as line from line-stream expected */
  _transform(line, encoding, callback) {
      // Check for the `mbox` "post mark" (`From `).
      let hasPostmark = line[0] === POSTMARK[0] &&
                        line[1] === POSTMARK[1] &&
                        line[2] === POSTMARK[2] &&
                        line[3] === POSTMARK[3] &&
                        line[4] === POSTMARK[4];

      /* TODO: check email after From see https://tools.ietf.org/rfc/rfc4155.txt */

      // If this is the first line of the file, and it doesn't have
      // a post mark, it's not considered to be a (valid) mbox file.
      if (this.firstLine && !hasPostmark) {
        if (this.opts.strict === true) {
          this.end(new Error('NOT_AN_MBOX_FILE'));
          return;
        }
        return;
      } else if (hasPostmark) {
        if( !this.firstLine ) {
          this.write( new Buffer(this.message.join("\n")), this.opts.encoding); /* TODO: solve backpressure! */
        }
        else {
          this.message.push(line);
        }
      }

      this.firstLine = false;
  }
}
