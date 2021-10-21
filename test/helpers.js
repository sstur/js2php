/*global global, process*/
(function (exports) {
  var stack = [];
  var toString = Object.prototype.toString;

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

  assert.shouldThrow = function (name, fn, message) {
    var threw = null;
    try {
      fn();
    } catch (e) {
      threw = e;
    }
    assert(name, threw !== null);
    if (typeof message === 'string') {
      assert(name, threw.message === message);
    } else if (message instanceof RegExp) {
      assert(name, message.test(threw.message));
    }
  };

  assert.shouldNotThrow = function (name, fn) {
    var threw = null;
    try {
      fn();
    } catch (e) {
      threw = e;
    }
    assert(name, threw === null);
  };

  assert.deepEqual = function (name, a, b) {
    assert(name, deepEqual(a, b));
  };

  function deepEqual(a, b, aStack, bStack) {
    aStack = aStack || [];
    bStack = bStack || [];
    if (a === b) {
      // edge case: technically `0 === -0`, but we don't care in this case
      return true;
    }
    if (a === null || b === null) {
      return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }
    var className = toString.call(a);
    if (className !== toString.call(b)) {
      return false;
    }
    switch (className) {
      case '[object Number]':
        return isNaN(a) && isNaN(b) ? true : a.valueOf() === b.valueOf();
      case '[object Date]':
      case '[object String]':
      case '[object Boolean]':
        return a.valueOf() === b.valueOf();
      case '[object RegExp]':
        return (
          a.source === b.source &&
          a.global === b.global &&
          a.multiline === b.multiline &&
          a.ignoreCase === b.ignoreCase
        );
    }
    // todo: Buffer
    // Assume equality for cyclic structures
    var length = aStack.length;
    while (length--) {
      if (aStack[length] === a) {
        return bStack[length] === b;
      }
    }
    aStack.push(a);
    bStack.push(b);
    // Recursively compare objects and arrays
    if (className === '[object Array]') {
      var size = a.length;
      if (size !== b.length) {
        return false;
      }
      // Deep compare the contents, ignoring non-numeric properties
      while (size--) {
        if (!deepEqual(a[size], b[size], aStack, bStack)) {
          return false;
        }
      }
    } else {
      if (a.constructor !== b.constructor) {
        return false;
      }
      if (a.hasOwnProperty('valueOf') && b.hasOwnProperty('valueOf')) {
        return a.valueOf() === b.valueOf();
      }
      var keys = Object.keys(a);
      if (keys.length !== Object.keys(b).length) {
        return false;
      }
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!deepEqual(a[key], b[key], aStack, bStack)) {
          return false;
        }
      }
    }
    aStack.pop();
    bStack.pop();
    return true;
  }

  exports.testSuite = testSuite;
  exports.assert = assert;
})(global);
