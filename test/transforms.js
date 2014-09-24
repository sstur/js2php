/*global require, module, exports, __dirname*/
exports.run = function() {
  var fs = require('fs');
  var path = require('path');
  var transform = require('../tools/transform.js');

  var content = fs.readFileSync(path.join(__dirname, 'transforms.txt'), 'utf8');

  console.log('Begin transform tests ...');
  content.split('----').forEach(function(content) {
    content = content.trim();
    var pair = content.split('====');
    var source = pair[0].trim();
    //allow first line of source to specify options
    if (source.match(/^\/\/@/)) {
      throw new Error('debug');
      source = source.split('\n');
      var opts = source.shift().slice(3);
      opts = JSON.parse(opts);
      source = source.join('\n');
    }
    var expected = pair[1].trim();
    opts = opts || {};
    opts.source = source;
    opts.initVars = opts.initVars || false;
    var result = transform(opts).trim();
    if (result !== expected) {
      var message = 'Error: Transformation yielded unexpected result\n';
      message += '>>>> Expected:\n' + expected + '\n';
      message += '>>>> Result:\n' + result + '\n';
      throw new Error(message);
    }
  });
  console.log('Transform tests completed successfully.');

};