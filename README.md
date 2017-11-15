# node-mbox

mbox file parser for Node.js.

##### Backward incompatibility warning

From version `1.0.0` onwards, message data is passed around as `Buffer` instead of `String`.

You can call `msg.toString([encoding])` to convert to a string, or explicitly set the `encoding` option (see below).

### Install

From the NPM repository:
```
$ npm install node-mbox
```

From the Github repository:
```
$ git clone https://github.com/robertklep/node-mbox.git
$ cd node-mbox
$ npm install [-g]
```

### Description

This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html). Starting with version 0.1.0, it's pretty speedy, processing a 1.5GB mbox file in about 20 seconds.

Note that this module doesn't parse the mail messages themselves, for which other solutions exist (for example the quite able [mailparser](https://github.com/andris9/mailparser) module from Andris Reinman).

### Example

See the included `example.js`:
```
$ npm install mailparser
$ node example < test/test-4-message.mbox
```

### Options

*  `encoding` : output encoding (default: `undefined`, meaning message data is passed as `Buffer`)
*  `strict` : enable strict mode (emits an error when input doesn't look like valid mbox data)
*  `streaming`: instead of collecting and emitting entire messages, emit a stream. This is useful if you want to process mailboxes that contain large messages (the aforementioned `mailparser` accepts message streams directly)

### Usage

```javascript
const Mbox = require('node-mbox');

// First, different types of instantiation:

// 1. pass it a filename
const mbox    = new Mbox('filename', { /* options */ });

// 2. pass it a string/buffer
const fs      = require('fs');
const mailbox = fs.readFileSync('filename');
const mbox    = new Mbox(mailbox, { /* options */ });

// 3. pass it a stream
const fs      = require('fs');
const stream  = fs.createReadStream('filename');
const mbox    = new Mbox(stream, { /* options */ });

// 4. pipe a stream to it
const mbox    = new Mbox({ /* options */ });
process.stdin.pipe(mbox);

// Next, catch events generated:
mbox.on('message', function(msg) {
  // `msg` is a `Buffer` instance
  console.log('got a message', msg.toString());
});

mbox.on('error', function(err) {
  console.log('got an error', err);
});

mbox.on('end', function() {
  console.log('done reading mbox file');
});
```

Streaming example:
```javascript
const mbox = new Mbox({ streaming : true });

// `message` event emits stream
mbox.on('message', function(stream) {
  stream.on('data', function(chunk) {
    ...
  }).on('end', function() {
    ...
  });
});

process.stdin.pipe(mbox);
```

### Testing

There is a limited number of tests:
```
$ cd /path/to/node-mbox/
$ npm test
```

## License

[MIT](https://raw.github.com/robertklep/node-mbox/master/LICENSE)
