(function() {

  var stack = [];
  function testSuite(name, fn) {
    stack.push(name);
    fn();
    stack.pop();
  }
  function assert(name, condition) {
    if (!condition) {
      var trace = stack.concat([name]).join(': ');
      throw new Error('Test Failure: ' + trace);
    }
  }

  testSuite('', function() {

  });

})();