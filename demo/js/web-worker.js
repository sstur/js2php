/*global importScripts, addEventListener, postMessage, Transformer */
importScripts('transformer.js');

addEventListener('message', function(e) {
  var data = e.data || {};
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
    result: result
  });
}, false);
