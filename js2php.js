#!/usr/bin/env node
/*global process, require, module, global*/
(function() {
  var fs = require('fs');
  var path = require('path');
  var argv = require('minimist')(process.argv.slice(2));
  var transform = require('./tools/transform.js');

  var outfile = argv.o || argv.out;
  var infiles = argv._;

  // #default is runtime embedded in output file
  // --runtime runtime.php #runtime exists at path; link to via require()
  // --runtime-only #output only the runtime
  // --fragment #no runtime included


  var pathToRuntime = (argv.runtime === true) ? 'runtime.php' : argv.runtime;
  if (!argv.fragment && !pathToRuntime) {
    var runtime = transform.buildRuntime();
    if (argv['runtime-only']) {
      outputContent(runtime, 'runtime.php');
      process.exit(0);
    }
  }

  if (!infiles.length) {
    log('No input file(s) specified.');
    process.exit(1);
  }

  var output = infiles.map(function(infile) {
    try {
      var source = fs.readFileSync(infile, 'utf8');
    } catch(e) {
      if (e.code === 'ENOENT') {
        log('Unable to open file `' +  infile + '`');
        process.exit(1);
      }
      throw e;
    }
    log('Processing file `' +  infile + '` ...');
    var output = transform({
      source: source
    });
    output.replace(/^\n+|\n+$/g, '');
    return output;
  });

  if (runtime) {
    output.unshift(runtime);
  } else
  if (pathToRuntime) {
    output.unshift('require_once(' + JSON.stringify(pathToRuntime) + ');');
  }
  outputContent('<?php\n' + output.join('\n\n') + '\n');
  log('Success');


  function outputContent(content, defaultFileName) {
    if (!outfile) {
      process.stdout.write(content);
      return;
    }
    if (defaultFileName && !outfile.match(/\.php$/)) {
      outfile = path.join(outfile, defaultFileName);
    }
    fs.writeFileSync(outfile, content, 'utf8');
    log('Output saved to', outfile);
  }

  function log() {
    if (outfile) {
      console.log.apply(console, arguments);
    } else {
      console.error.apply(console, arguments);
    }
  }

})();