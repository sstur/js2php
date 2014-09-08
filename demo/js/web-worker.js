/*global importScripts, addEventListener, postMessage, Transformer */
importScripts('transformer.js');

addEventListener('message', function(e) {
  var data = e.data || {};
  var opts = data.opts || {};
  if (opts.noCatch) {
    //allow error to be thrown for debugging
    var result = Transformer({source: data.sourceCode});
  } else {
    try {
      result = Transformer({source: data.sourceCode});
    } catch (e) {
      result = '<php\n/* ERROR TRANSFORMING SOURCE:\n' + e.message + ' */';
    }
  }
  postMessage({
    result: result
  });
}, false);
