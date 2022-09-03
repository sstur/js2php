#!/usr/bin/env node
var processStartInMs = Date.now();
var tests = ['core', 'number', 'boolean', 'string', 'date', 'regex', 'array', 'buffer', 'json']; //, 'module-fs'];
require('./test/helpers');
for(var i in tests) {
    var test = tests[i];
    var path = './test/' + test;
    var startTimeInMs = Date.now();
    var numOfLoops = 1000;
    for (var j = 0; j < numOfLoops; j++) {
        delete require.cache[require.resolve(path)];
        require(path);
    }
    var endTimeInMs = Date.now();
    var duration = endTimeInMs - startTimeInMs;
    console.log(test + ', total: ' + duration + ' ms, each run: ' + (duration / numOfLoops) + ' ms');
}
var processEndInMs = Date.now();
var processDuration = processEndInMs - processStartInMs;
console.log('process total: ' + processDuration + ' ms, each run: ' + (processDuration / numOfLoops) + ' ms');