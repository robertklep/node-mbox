'use strict';
const {Transform, Writable} = require('stream');
const split                 = require('line-stream');
const POSTMARK              = Buffer.from('From ');

/**
 * @class Class implements Transform stream. Transforming lines to messages as Buffers.
 *
 * @example fs.createReadStream(process.argv[2], {encoding: 'utf-8'}).pipe(split('\n'))
 * .pipe(new Mbox({encoding: "utf-8"})).on("data", function(data) {
 *   simpleParser(data, undefined, (err, parsed) => {
 *     if(err) {
 *       process.exit(-1);
 *     }
 *
 *     console.log("Attachment:> ", parsed.attachments);
 *   });
 * });
 */
class Mbox extends Transform {
  /**
   *
   * @param {*} opts Options.
   * @param {Boolean} opts.includeMboxHeader Predicate if include header of Mbox entry i.e. 'From ... ...' or not.
   */
  constructor(opts) {
    super();
    this.opts = opts || {includeMboxHeader: false};
    this.firstLine = true;
    this.message = [];
    this.messageCount = 0;

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
    if (this.firstLine && !hasPostmark) {
      this.destroy(new Error('NOT_AN_MBOX_FILE'));
      return;
    } else if (hasPostmark) {
      if( !this.firstLine ) {
        this.push( Buffer.concat(this.message) );
        this.messageCount++;
      }

      this.message = [];

      if( this.opts.includeMboxHeader ) {
        this.message.push(line);
      }

      callback();
    }
    else {
      this.message.push(line);
      callback();
    }

    this.firstLine = false;
  }

  _flush(cb) {
    if( this.message.length > 0){
      this.push(Buffer.concat(this.message));
    }

    this.push(null);
    cb();
  }
}


/**
 * MboxStream simply pipes `split('\n')` with Mbox().
 *
 * @param {stream.Readable} readStream An instance of Readable stream.
 * @param {*} opts Params passed to Mbox.
 *
 * @returns {Mbox} An instance of Mbox stream.
  */
function MboxStream(inputStream, opts) {
  return inputStream.pipe(split('\n')).pipe(new Mbox(opts));
}

/**
 * @class
 *
 * MboxStreamConsumer is simple abstract class extending Writable.
 * You must implement consume method which consumes particural messages.
 *
 * @example fs.createReadStream().pipe(MboxStream()).pipe((new MboxStreamConsumer()).consume = function(message, encoding, cb){
 *    console.log(message);
 *    setImmediate(cb);
 *  }).on("finish", cb);
 */
class MboxStreamConsumer extends Writable {
  constructor(opts) {
    super(opts);
  }

  /**
   *
   * @param {Buffer} message
   * @param {BufferEncoding} encoding
   * @param {callback} cb Async callback of form ([err]) => {}.
   */
  consume(message, encoding, cb) {
    cb(new Error("Not Implemented."));
  }

  _write (message, encoding, cb) {
    this.consume(message, encoding, cb);
  }
}

module.exports = {
  Mbox: Mbox,
  MboxStream: MboxStream,
  MboxStreamConsumer: MboxStreamConsumer
};