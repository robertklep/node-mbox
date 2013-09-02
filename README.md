node-mbox
=========

mbox file parser for Node.js.

Description
-----------
This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html).

To speed things up, this module uses a memory buffer to read up to X MB (by
default, X equals 64) into memory before parsing out messages. To give an
idea on how much this speeds things up, when parsing a 600MB mbox file
(containing about 11K messages):

*  without any buffering: about 80 seconds
*  with 32MB buffer: about 20 seconds
*  with 64MB buffer:  about 3 seconds

If you don't have any memory to spare, just set the `buffer_size` option
to 0.

Note that this module doesn't parse the mail messages themselves, for which
other solutions exist (for example the quite able
[mailparser](https://github.com/andris9/mailparser) module from Andris
Reinman).

Options
-------

*  `buffer_size` : number of MB's to use for internal buffering (default: 64; set to 0 to turn off buffering)

Usage
-----
```javascript
var Mbox = require('node-mbox');

// First, different types of instantiation:

// 1. pass it a filename
var mbox    = new Mbox('filename', { /* options */ });

// 2. pass it a string
var fs      = require('fs');
var mailbox = fs.readFileSync('filename');
var mbox    = new Mbox(mailbox, { /* options */ });

// 3. pass it a stream
var fs      = require('fs');
var stream  = fs.createReadStream('filename');
var mbox    = new Mbox(stream, { /* options */ });

// 4. pipe a stream to it
var mbox    = new Mbox({ /* options */ });
process.stdin.pipe(mbox);

// Next, catch events generated:
mbox.on('message', function(msg) {
  console.log('got a message', msg);
});

mbox.on('end', function() {
  console.log('done reading mbox file');
});
```

License
-------
[MIT](https://raw.github.com/robertklep/node-mbox/master/LICENSE)
