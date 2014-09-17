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
      throw new Error(errorMessage);
    }
  }

  assert.shouldThrow = function(name, fn) {
    var threw = false;
    try {
      fn();
    } catch(e) {
      threw = true;
    }
    assert(name, threw);
  };

  exports.testSuite = testSuite;
  exports.assert = assert;

})(global);