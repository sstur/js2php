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

  assert.shouldThrow = function(name, fn, message) {
    var threw = null;
    try {
      fn();
    } catch(e) {
      threw = e;
    }
    assert(name, threw !== null);
    if (typeof message === 'string') {
      assert(name, threw.message === message);
    } else
    if (message instanceof RegExp) {
      assert(name, message.test(threw.message));
    }
  };

  exports.testSuite = testSuite;
  exports.assert = assert;

})(global);