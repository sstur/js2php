/*global global, process*/
(function(exports) {

  var stack = [];

  function testSuite(name, fn) {
    stack.push(name);
    fn(assert);
    stack.pop();
  }

  function assert(name, condition) {
    if (!condition) {
      stack.push(name);
      var errorMessage = 'Test Failure: ' + stack.join(': ');
      console.log(errorMessage);
      process.exit(1);
    }
  }

  exports.testSuite = testSuite;
  exports.assert = assert;

})(global);