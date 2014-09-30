/*global global, testSuite*/
testSuite('core', function(assert) {

  function throwCatch(value) {
    try {
      throw value;
    } catch(e) {
      return e;
    }
  }

  testSuite('object', function() {
    var toString = Object.prototype.toString;
    //assert('toString.call(null)', toString.call(null) === '[object Null]');
    //assert('toString.call(undefined)', toString.call(undefined) === '[object Undefined]');
    assert('toString.call("")', toString.call('') === '[object String]');
    assert('toString.call(0)', toString.call(0) === '[object Number]');
    assert('toString.call(false)', toString.call(false) === '[object Boolean]');
    assert('toString.call([])', toString.call([]) === '[object Array]');
    assert('toString.call(new String)', toString.call(new String()) === '[object String]');
  });

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
    for (var k in c) {
      a.push(k);
    }
    assert('should iterate all keys', a.sort().join('') === 'abcdef');
    var d = Object.create(null);
    //todo: Object.getPrototypeOf
    assert('should allow null proto', Object.keys(d).length === 0);
    for (var n in d) {
      var found = true;
    }
    assert('should have no keys', found !== true);
  });

  testSuite('global', function() {
    var nothing = void 0;
    var a = [];
    for (var key in global) {
      a.push(key);
    }
    assert('keys not contain natives', a.indexOf('GLOBALS') === -1);
    assert('keys contain Object', a.indexOf('Object') !== -1);
    assert('keys contain self', a.indexOf('global') !== -1);
    assert('in operator not find natives', !('_SERVER' in global));
    assert('in operator find Math', 'Math' in global);
    assert('in operator walk prototype chain', 'toString' in global);
    var b = Object.keys(global);
    assert('Object.keys works', b.join(',') === a.join(','));
    assert('can access undeclared', global.asdf === nothing);
    assert('contains `undefined`', 'undefined' in global);
    global.undefined = 'foo';
    assert('re-assigning built-in global does nothing', global.undefined === nothing);
    delete global.Infinity;
    assert('deleting built-in global does nothing', typeof global.Infinity === 'number');
  });

  testSuite('numbers', function() {
    assert('NaN global', 'NaN' in global);
    assert('Number.NaN', NaN.toString() === Number.NaN.toString());
    assert('Number.NaN', String(NaN) === String(Number.NaN));
    assert('isNaN', isNaN(NaN));
    assert('non-equality', NaN !== NaN);
    assert('Positive Infinity', Number.POSITIVE_INFINITY === Infinity);
    assert('Negative Infinity', Number.NEGATIVE_INFINITY === -Infinity);
  });

  testSuite('functions', function() {
    var o = {};
    var fn1 = function(a) { return this; };
    assert('instance of Function', fn1 instanceof Function);
    assert('function has length', fn1.length === 1);
    assert('function properties not enumerable', Object.keys(fn1).length === 0);
    assert('can call null', fn1.call(null) === global);
    assert('can call object', fn1.call(o) === o);
    assert('can call object.prototype functions', Object.prototype.toString.call([]) === '[object Array]');
    assert('can apply object', fn1.apply(o, []) === o);
    assert('can apply object without second param', fn1.apply(o) === o);
    var $fn1 = fn1.bind(o);
    assert('bind creates new function', $fn1 !== fn1);
    assert('bind works', $fn1.call(null) === o);
    var fn2 = function() { return arguments.length; };
    assert('can call args', fn2.call(null, false, void 0) === 2);
    assert('can apply args', fn2.apply(o, [0, null, o]) === 3);
    (function a() {
      (function b() {
        assert('arguments.callee', arguments.callee === b);
        assert('arguments.caller', arguments.caller === a);
      })();
    })();
  });

  testSuite('more functions', function() {
    var fn1 = function(a, b, c) { return [a, b, c]; };
    var fn2 = fn1.bind(null, 1, '2');
    assert('function arity', fn1.length === 3);
    assert('bound function arity', fn2.length === 1);
    var result = fn2('a', 'b', 'c');
    assert('bound function with args', result.join(';') === '1;2;a');
  });

  testSuite('throw/catch', function() {
    var nothing = void 0;
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
    var e1 = new TypeError('message');
    assert('TypeError', e1 instanceof TypeError);
    assert('TypeError inherits from Error', e1 instanceof Error);
    assert('TypeError is distinct from Error', TypeError !== Error);
  });

});