/*global importScripts, Transformer */
var isWebWorker = (typeof importScripts === 'function');
if (isWebWorker) {
  importScripts('transformer.js');
}

(function(global) {

  function postMessage(data) {
    return (isWebWorker) ? global.postMessage(data) : global.postMessage(data, '*');
  }

  global.addEventListener('message', function(e) {
    var data = e.data || {};
    if (data.command !== 'transform') {
      return;
    }
    setTimeout(function() {
      var opts = data.opts || {};
      if (opts.noCatch) {
        //allow error to be thrown for debugging
        var result = Transformer({source: data.sourceCode});
        result = 'require_once("runtime.php");\n\n' + result;
      } else {
        try {
          result = Transformer({source: data.sourceCode});
        } catch (e) {
          result = '/* ERROR TRANSFORMING SOURCE:\n' + e.message + ' */';
        }
        result = '<?php\n' + result;
      }
      postMessage({
        command: 'transform-complete',
        result: result
      });
    }, 1);
  }, false);

})(Function('return this')());