// mailparser": "^2.0.1",
var MailParser  = require('mailparser').MailParser;
var Mbox        = require('./src/mbox');
var mbox        = new Mbox();

// wait for message events
mbox.on('message', function(msg) {
  // parse message using MailParser
  var mailparser = new MailParser({ streamAttachments : true });
  mailparser.on('headers', function(headers) {
    console.log('From   :', headers.get('from').value[0].address);
    console.log('Subject:', headers.get('subject'), '\n');
  });
  mailparser.write(msg);
  mailparser.end();
});

// pipe stdin to mbox parser
process.stdin.pipe(mbox);
