/*global global, testSuite, Buffer*/
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
    a = [];
    a[5] = 1;
    assert(
      'sparse arrays should serialize correctly',
        JSON.stringify(a) === '[null,null,null,null,null,1]'
    );
    //var d = new Date(Date.UTC(1994, 6, 3));
    //assert(
    //  'dates should serialze correctly',
    //  JSON.stringify(d) === '"1994-07-03T00:00:00.000Z"'
    //);
    //d = new Date(Date.UTC(1993, 5, 2, 2, 10, 28, 224));
    //assert(
    //  'dates with milliseconds',
    //  JSON.stringify(d) === '"1993-06-02T02:10:28.224Z"'
    //);
    //d = new Date(-1);
    //assert(
    //  'date initialized with negative epoch ms',
    //  JSON.stringify(d) === '"1969-12-31T23:59:59.999Z"'
    //);
  });

});
