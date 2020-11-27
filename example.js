// mailparser": "^2.1.0",
const MailParser = require('mailparser').MailParser;
const {Mbox, MboxStream}= require('./src/mbox');


// pipe stdin to mbox parser
MboxStream(process.stdin).on('data', function(msg) {
  // parse message using MailParser
  let mailparser = new MailParser({ streamAttachments : true });
  mailparser.on('headers', function(headers) {
    console.log('From   :', headers.get('from').value[0].address);
    console.log('Subject:', headers.get('subject'), '\n');
  });
  mailparser.write(msg);
  mailparser.end();
});
