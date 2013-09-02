node-mbox
=========

mbox file parser for Node.js.

Description
-----------
This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html).

If you're using streams (see [Usage](#usage)), it will only buffer enough data in memory until it can parse a complete mail message,
at which point a `message` event is generated and the message will be removed from the internal buffer.

Note that this module doesn't parse the mail messages themselves, for which other solutions exist (for example the quite
able [mailparser](https://github.com/andris9/mailparser) module from Andris Reinman).

Usage
-----
```javascript
var Mbox = require('node-mbox');

// First, different types of instantiation:

// 1. pass it a filename
var mbox    = new Mbox('filename');

// 2. pass it a string
var fs      = require('fs');
var mailbox = fs.readFileSync('filename');
var mbox    = new Mbox(mailbox);

// 3. pass it a stream
var fs      = require('fs');
var stream  = fs.createReadStream('filename');
var mbox    = new Mbox(stream);

// 4. pipe a stream to it
var mbox    = new Mbox();
process.stdin.pipe(mbox);

// Next, catch events generated:
mbox.on('message', function(msg) {
  console.log('got a message', msg);
});

mbox.on('end', function() {
  console.log('done reading mbox file');
});
```
