/*global process*/
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
      process.exit(1);
    }
  }

  function throwCatch(value) {
    try {
      throw value;
    } catch(e) {
      return e;
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

  testSuite('for..in', function() {
    var nothing;
    var a = [];
    var b = {a: null, b: nothing, c: 0, d: false, e: '1'};
    for (var key in b) {
      a.push(key);
    }
    assert('should iterate keys', a.join('') === 'abcde');
    var c = Object.create(b);
    assert('should inherit', c.c === 0);
    c.f = null;
    a = [];
    for (var key in c) {
      a.push(key);
    }
    assert('should iterate all keys', a.sort().join('') === 'abcdef');
  });

  testSuite('throw/catch', function() {
    var nothing;
    assert('can throw undefined', throwCatch(nothing) === nothing);
    assert('can throw null', throwCatch(null) === null);
    assert('can throw number', throwCatch(1) === 1);
    var e = new Error('err');
    assert('can throw error', throwCatch(e) === e);
    try {
      throw 'foo';
    } catch(e) {
      assert('catch creates scope', e === 'foo');
    }
    assert('catch scope doesn\'t bleed', e instanceof Error);
  });

  console.log('Success');

})();