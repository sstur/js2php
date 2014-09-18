/*global global, testSuite*/
(function() {

  function throwCatch(value) {
    try {
      throw value;
    } catch(e) {
      return e;
    }
  }

  testSuite('in operator', function(assert) {
    var o = {a: null};
    assert('should be true for null', 'a' in o);
    o.b = void 0;
    assert('should be true for undefined', 'b' in o);
    assert('should be false for non-existant', !('c' in o));
    delete o.b;
    assert('should be false when deleted', !('b' in o));
  });

  testSuite('for..in', function(assert) {
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
  });

  testSuite('global', function(assert) {
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
    assert('setting `undefined` does nothing', global.undefined === nothing);
  });

  testSuite('functions', function(assert) {
    var o = {};
    var fn1 = function() { return this; };
    assert('instance of Function', fn1 instanceof Function);
    assert('can call null', fn1.call(null) === global);
    assert('can call object', fn1.call(o) === o);
    assert('can apply object', fn1.apply(o, []) === o);
    var $fn1 = fn1.bind(o);
    assert('bind creates new function', $fn1 !== fn1);
    assert('bind works', $fn1.call(null) === o);
    var fn2 = function() { return arguments.length; };
    assert('can call args', fn2.call(null, false, void 0) === 2);
    assert('can apply args', fn2.apply(o, [0, null, o]) === 3);
  });

  testSuite('more functions', function(assert) {
    var fn1 = function(a, b, c) { return [a, b, c]; };
    var fn2 = fn1.bind(null, 1, '2');
    assert('function arity', fn1.length === 3);
    assert('bound function arity', fn2.length === 1);
    var result = fn2('a', 'b', 'c');
    assert('bound function with args', result.join(';') === '1;2;a');
  });

  testSuite('strings', function(assert) {
    testSuite('length', function() {
      var s = 'abcd';
      assert('ascii', s.length === 4);
      s = '↗Զ';
      assert('unicode', s.length === 2);
      assert('direct access', '↗Զ'.length === 2);
    });
    testSuite('charAt', function() {
      assert('ascii 0', 'abc'.charAt(0) === 'a');
      assert('ascii 1', 'abc'.charAt(1) === 'b');
      assert('unicode', '↗Զ'.charAt(1) === 'Զ');
    });
    testSuite('charCodeAt', function() {
      assert('ascii 0', 'abc'.charCodeAt(0) === 97);
      assert('ascii 1', 'abc'.charCodeAt(1) === 98);
      assert('unicode', '↗Զ'.charCodeAt(1) === 1334);
    });
    testSuite('slice', function() {
      var s = 'abcdefghi';
      assert('one char slice', s.slice(0, 1) === 'a');
      assert('middle slice', s.slice(1, 3) === 'bc');
      assert('end slice', s.slice(2) === 'cdefghi');
      assert('neg start', s.slice(-2) === 'hi');
      assert('neg start, pos end', s.slice(-2, 8) === 'h');
      assert('neg start, neg end', s.slice(-2, -1) === 'h');
      assert('pos start, neg end', s.slice(1, -1) === 'bcdefgh');
    });
  });

  testSuite('throw/catch', function(assert) {
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
  });

})();