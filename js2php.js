#!/usr/bin/env node
/*global process, require, module, global*/
(function() {
  var fs = require('fs');
  var argv = require('minimist')(process.argv.slice(2));
  var transform = require('./transformer/transform.js');

  var infile = argv._[0] || './_sample.js';
  var outfile = argv.o || argv.out;

  try {
    var source = fs.readFileSync(infile, 'utf8');
  } catch(e) {
    if (e.code === 'ENOENT') {
      console.error('Unable to open file:', infile);
      process.exit(1);
    }
    throw e;
  }

  if (outfile) {
    console.log('Transforming source ...');
  }
  var output = transform({
    source: source,
    buildRuntime: argv.runtime
  });
  if (outfile) {
    fs.writeFileSync(outfile, output, 'utf8');
    console.log('Success');
  } else {
    process.stdout.write(output);
  }

})();