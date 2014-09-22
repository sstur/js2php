/*global global, testSuite, Buffer*/
(function() {

  testSuite('json', function(assert) {

    testSuite('stringify', function() {
      assert('string primitive', JSON.stringify('s') === '"s"');
      var a = [true,false, 1, null, undefined, NaN, Infinity, -Infinity, 's'];
      assert('primitives', JSON.stringify(a) === '[true,false,1,null,null,null,null,null,"s"]');
      a = new Array(3);
      assert('empty array', JSON.stringify(a) === '[null,null,null]');
      a = [new String('s'), new Boolean(false), new Number(3)];
      assert('boxed primitives', JSON.stringify(a) === '["s",false,3]');
      var s = '\\"How\bquickly\tdaft\njumping\fzebras\rvex"';
      assert(
        'control characters',
        JSON.stringify(s) === '"\\\\\\"How\\bquickly\\tdaft\\njumping\\fzebras\\rvex\\""'
      );
      var o = {"foo":{"b":{"foo":{"c":{"foo":null}}}}};
      assert(
        'nested objects containing identically-named properties should serialize correctly',
        JSON.stringify(o) === '{"foo":{"b":{"foo":{"c":{"foo":null}}}}}'
      );
      o = {};
      a = [o, o];
      assert(
        'objects containing duplicate references should not throw',
        JSON.stringify(a) === '[{},{}]'
      );
      o = {a: undefined, b: 1};
      assert(
        'object properties with value undefined are skipped',
        JSON.stringify(o) === '{"b":1}'
      );
      o = {b: new Buffer('abc')};
      assert(
        'should serialize buffer to string',
        JSON.stringify(o) === '{"b":"<Buffer 616263>"}'
      );
    });

  });

})();