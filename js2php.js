/*global process, require, module, global*/
(function () {
  // #default is runtime embedded in output file
  // --runtime runtime.php #runtime exists at path; link to via require()
  // --runtime-only #output only the runtime
  // --fragment #no runtime included
  // --test #run tests only

  var fs = require('fs');
  var path = require('path');
  var yargs = require('yargs');
  var transform = require('./tools/transform.js');
  var childProcess = require('child_process');

  var argv = yargs
    .boolean(['debug', 'fragment', 'runtime-only', 'test', 'quiet'])
    .alias('out', 'o')
    .alias('quiet', 'q')
    .alias('modules', 'm').argv;

  var logTo = argv.quiet ? 'none' : 'stdout';

  if (argv.test) {
    require('./test/transforms').run();
    compileTests();
    runTests();
  } else {
    processTransform(argv);
  }

  function processTransform(argv) {
    var outfile = argv.out;
    if (logTo === 'stdout' && !outfile) {
      logTo = 'stderr';
    }

    var pathToRuntime = argv.runtime;
    if (!argv.fragment && !pathToRuntime) {
      var includeModules = argv.modules || '';
      var includeAllModules = false;
      if (includeModules === 'all') {
        includeAllModules = true;
        includeModules = '';
      }
      includeModules = includeModules.split(',');
      var runtime = transform.buildRuntime({
        includeModules: includeModules,
        includeAllModules: includeAllModules,
        includeDebug: argv.debug,
        includeTest: argv.test,
        log: log,
      });
      if (argv['runtime-only']) {
        outputContent(outfile, '<?php\n' + runtime, 'runtime.php');
        process.exit(0);
      }
    }

    var infiles = argv._;
    if (infiles.length) {
      //process input from files specified as arguments
      processInputFiles(infiles);
    } else if (!process.stdin.isTTY) {
      //process input from stdin
      processInputStream();
    } else {
      log('No input file(s) specified.');
      process.exit(1);
    }

    function processInputStream() {
      var input = [];
      var stdin = process.stdin;
      stdin.setEncoding('utf8');
      stdin.on('data', function (data) {
        input.push(data);
      });
      stdin.on('end', function () {
        var source = input.join('');
        log('Processing input from STDIN ...');
        var output = transform({
          source: source,
        });
        output = output.replace(/^\n+|\n+$/g, '');
        if (runtime) {
          output = runtime + '\n\n' + output;
        } else if (pathToRuntime) {
          output =
            'require_once(' + JSON.stringify(pathToRuntime) + ');\n\n' + output;
        }
        outputContent(outfile, '<?php\n' + output + '\n');
      });
      stdin.resume();
    }

    function processInputFiles(infiles) {
      var output = infiles.map(function (infile) {
        try {
          var source = fs.readFileSync(infile, 'utf8');
        } catch (e) {
          if (e.code === 'ENOENT') {
            log('Unable to open file `' + infile + '`');
            process.exit(1);
          }
          throw e;
        }
        log('Processing file `' + infile + '` ...');
        var output = transform({
          source: source,
        });
        output = output.replace(/^\n+|\n+$/g, '');
        return output;
      });

      if (runtime) {
        output.unshift(runtime);
      } else if (pathToRuntime) {
        output.unshift('require_once(' + JSON.stringify(pathToRuntime) + ');');
      }
      outputContent(outfile, '<?php\n' + output.join('\n\n') + '\n');
    }
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
    testSource.replace(
      /require_once\('test\/compiled\/(.*?)\.php'\)/g,
      function (_, name) {
        var argv = {
          fragment: true,
          out: __dirname + '/test/compiled/' + name + '.php',
          _: [__dirname + '/test/' + name + '.js'],
        };
        processTransform(argv);
      }
    );
  }

  function runTests() {
    var child = childProcess.spawn('php', ['-f', 'tests.php'], {
      cwd: __dirname,
    });
    child.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    child.stderr.on('data', function (data) {
      process.stderr.write(data);
    });
    child.on('close', function (code) {
      process.exit(code);
    });
  }

  function log() {
    if (logTo === 'stdout') {
      console.log.apply(console, arguments);
    } else if (logTo === 'stderr') {
      console.error.apply(console, arguments);
    }
  }
})();
