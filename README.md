node-mbox
=========

mbox file parser for Node.js.

Install
-------
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

Description
-----------
This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html). Starting with version 0.1.0, it's pretty speedy, processing a 700MB mbox file in about 3 seconds.

Note that this module doesn't parse the mail messages themselves, for which other solutions exist (for example the quite able [mailparser](https://github.com/andris9/mailparser) module from Andris Reinman).

Example
-------
See the included `example.js`:
```
$ npm install mailparser
$ node example < test/test.mbox
```

Options
-------

*  `encoding` : output encoding (default: `binary`).
*  `strict` : enable strict mode (emits an error when input doesn't look like valid mbox data)

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

mbox.on('error', function(err) {
  console.log('got an error', err);
});

mbox.on('end', function() {
  console.log('done reading mbox file');
});
```

Testing
-------
There is a limited number of tests:
```
$ cd /path/to/node-mbox/
$ npm test
```

License
-------
[MIT](https://raw.github.com/robertklep/node-mbox/master/LICENSE)
