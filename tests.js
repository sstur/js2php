(function() {

  var stack = [];

  function testSuite(name, fn) {
    stack.push(name);
    fn();
    stack.pop();
  }

  function assert(name, condition) {
    if (!condition) {
      stack.push(name);
      var errorMessage = 'Test Failure: ' + stack.join(': ');
      console.log(errorMessage);
      throw new Error(errorMessage);
    }
  }

  testSuite('in operator', function() {
    var o = {a: null};
    assert('should be true for null', 'a' in o);
    o.b = void 0;
    assert('should be true for undefined', 'b' in o);
    assert('should be false for non-existant', !('c' in o));
    delete o.b;
    assert('should be false when deleted', !('b' in o));
  });

})();