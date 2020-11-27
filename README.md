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

This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html) but not 100% conform to [https://tools.ietf.org/rfc/rfc4155.txt] still. Starting with version 0.1.0, it's pretty speedy, processing a 1.5GB mbox file in about 20 seconds.

Note that this module doesn't parse the mail messages themselves, for which other solutions exist (for example the quite able [mailparser](https://github.com/andris9/mailparser) module from Andris Reinman).

### Example

See the included `example.js`:
```
$ npm install mailparser
$ node example < test/test-4-message.mbox
```

### Options
*  `includeMboxHeader` : predicate if include Mbox header i.e. `FROM ... ...` lines (false by default).

### Usage

```javascript
const {Mbox, MboxStream} = require('node-mbox');
const split = require('line-stream');

// Ways of use.

// 1. pass it a filename
const mbox    = new Mbox({ /* options */ });

// 2. pass it a stream and use custom line splitter.
const fs      = require('fs');
const mailbox = fs.createReadStream('filename');
const splitter= split('\n');
const mbox    = mailbox.pipe(splitter).pipe(new Mbox({ /* options */ }));

// 3. pass it a stream and use default line splitter
const fs      = require('fs');
const mailbox = fs.createReadStream('filename');
const mbox    = MboxStream(mailbox, { /* options */ }); // It does the same as in 2. case.

// Next, catch events generated:
mbox.on('data', function(msg) {
  // `msg` is a `Buffer` instance
  console.log('got a message', msg.toString());
});

mbox.on('error', function(err) {
  console.log('got an error', err);
});

mbox.on('finish', function() {
  console.log('done reading mbox file');
});
```

### Testing

There is a limited number of tests:
```
$ cd /path/to/node-mbox/
$ npm test
```

## License

[MIT](https://raw.github.com/robertklep/node-mbox/master/LICENSE)
