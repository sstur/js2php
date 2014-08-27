#!/usr/bin/env node
/*global process, require, module, global*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var argv = require('minimist')(process.argv.slice(2));
  var transform = require('./transformer/transform.js');

  var outfile = argv.o || argv.out;


  if (argv.runtime) {
    var runtime = transform.buildRuntime();
    //todo: support --varname phpRuntime
    if (outfile) {
      if (!outfile.match(/\.php$/)) {
        outfile = path.join(outfile, 'runtime.php');
      }
      fs.writeFileSync(outfile, runtime, 'utf8');
      console.log('Runtime saved to', outfile);
    } else {
      process.stdout.write(runtime);
    }
    process.exit(0);
  }

  var infile = argv._[0];
  if (!infile || !infile.match(/\.js$/)) {
    console.log('No input file specified.');
    process.exit(1);
  }
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
    buildRuntime: argv.runtime,
    outpath: outfile ? path.dirname(outfile) : null
  });
  if (outfile) {
    fs.writeFileSync(outfile, output, 'utf8');
    console.log('Success');
  } else {
    process.stdout.write(output);
  }

})();