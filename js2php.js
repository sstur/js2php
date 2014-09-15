#!/usr/bin/env node
/*global process, require, module, global*/
(function() {
  // #default is runtime embedded in output file
  // --runtime runtime.php #runtime exists at path; link to via require()
  // --runtime-only #output only the runtime
  // --fragment #no runtime included

  var fs = require('fs');
  var path = require('path');
  var argv = require('minimist')(process.argv.slice(2));
  var transform = require('./tools/transform.js');
  var child_process = require('child_process');

  var logToStdOut = true;

  if (argv.test) {
    compileTests();
    runTests();
  } else {
    processFiles(argv);
  }


  function processFiles(argv) {
    var outfile = argv.o || argv.out;
    var infiles = argv._;

    logToStdOut = !!outfile;

    var pathToRuntime = (argv.runtime === true) ? 'runtime.php' : argv.runtime;
    if (!argv.fragment && !pathToRuntime) {
      var runtime = transform.buildRuntime();
      if (argv['runtime-only']) {
        outputContent(outfile, runtime, 'runtime.php');
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
    outputContent(outfile, '<?php\n' + output.join('\n\n') + '\n');
  }

  function outputContent(outfile, content, defaultFileName) {
    if (!outfile) {
      process.stdout.write(content);
      log('Output sent to STDOUT');
      return;
    }
    if (defaultFileName && !outfile.match(/\.php$/)) {
      outfile = path.join(outfile, defaultFileName);
    }
    fs.writeFileSync(outfile, content, 'utf8');
    log('Output saved to', outfile);
  }

  function compileTests() {
    var testSource = fs.readFileSync(__dirname + '/tests.php', 'utf8');
    testSource.replace(/require_once\('test\/compiled\/(.*?)\.php'\)/g, function(_, name) {
      var argv = {
        fragment: true,
        out: __dirname + '/test/compiled/' + name + '.php',
        _: [__dirname + '/test/' + name + '.js']
      };
      processFiles(argv);
    });
  }

  function runTests() {
    var child = child_process.spawn('php', ['-f', 'tests.php'], {cwd: __dirname});
    child.stdout.on('data', function(data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function(data) {
      process.stderr.write(data);
    });
    child.on('close', function(code) {
      process.exit(code);
    });
  }

  function log() {
    if (logToStdOut) {
      console.log.apply(console, arguments);
    } else {
      console.error.apply(console, arguments);
    }
  }

})();