/*global global, testSuite, Buffer*/
testSuite('buffer', function(assert) {

  testSuite('strings', function() {
    var b = new Buffer('sa');
    assert('string without encoding specified', b.toString() === 'sa');
    b = new Buffer('sa', 'utf8');
    assert('string with utf8', b.toString() === 'sa');
    assert('string with utf8 length', b.length === 2);
    b = new Buffer('↗Զ');
    assert('string with utf8 extended', b.toString() === '↗Զ');
    assert('string with utf8 extended length', b.length === 5);
  });


  testSuite('binary', function() {
    var b = new Buffer(2);
    assert('length', b.length === 2);
    assert('index access', b.get(1) === 0);
    assert.shouldThrow('get invalid offset', function() {
      b.get(2);
    });
    b.set(0, 97);
    b.set(1, 98);
    assert('can set bytes', b.toString() === 'ab');
    assert.shouldThrow('set invalid offset', function() {
      b.set(-1, 0);
    });
  });


  testSuite('slice', function() {
    var b = new Buffer('abcdefghi');
    assert('one char slice', b.slice(0, 1).toString() === 'a');
    assert('middle slice', b.slice(1, 3).toString() === 'bc');
    assert('end slice', b.slice(2).toString() === 'cdefghi');
    assert('neg start', b.slice(-2).toString() === 'hi');
    assert('neg start, pos end', b.slice(-2, 8).toString() === 'h');
    assert('neg start, neg end', b.slice(-2, -1).toString() === 'h');
    assert('pos start, neg end', b.slice(1, -1).toString() === 'bcdefgh');
  });


  testSuite('write', function() {
    var b = new Buffer('abcdef');
    b.write('xx', 'ascii', 2);
    assert('write all', b.toString() === 'abxxef');
    b.write('yyzz', 'ascii', 2, 2);
    assert('write some', b.toString() === 'abyyef');
    b.write('__', 0);
    assert('write beginning', b.toString() === '__yyef');
    b.write('---', 4, 2);
    assert('write end', b.toString() === '__yy--');
  });


  testSuite('encode hex', function() {
    var encode = function(str) {
      return new Buffer(str).toString('hex');
    };
    assert('[empty]', encode('') === '');
    assert('e1', encode('abc') === '616263');
    assert('e2', encode('\x00') === '00');
  });


  testSuite('decode hex', function() {
    var decode = function(str) {
      return new Buffer(str, 'hex').toString('ascii');
    };
    assert('[empty]', decode('') === '');
    assert('d1', decode('616263') === 'abc');
    assert('d2', decode('00') === '\x00');
  });


  testSuite('encode base64', function() {
    var encode = function(str) {
      return new Buffer(str, 'ascii').toString('base64');
    };
    assert('[empty]', encode('') === '');
    assert('e1', encode('f') === 'Zg==');
    assert('e2', encode('fo') === 'Zm8=');
    assert('e3', encode('foo') === 'Zm9v');
    assert('e4', encode('quux') === 'cXV1eA==');
    assert('e5', encode('!"#$%') === 'ISIjJCU=');
    assert('e6', encode("&'()*+") === 'JicoKSor');
    assert('e7', encode(',-./012') === 'LC0uLzAxMg==');
    assert('e8', encode('3456789:') === 'MzQ1Njc4OTo=');
    assert('e9', encode(';<=>?@ABC') === 'Ozw9Pj9AQUJD');
    assert('e10', encode('DEFGHIJKLM') === 'REVGR0hJSktMTQ==');
    assert('e11', encode('NOPQRSTUVWX') === 'Tk9QUVJTVFVWV1g=');
    assert('e12', encode('YZ[\\]^_`abc') === 'WVpbXF1eX2BhYmM=');
    assert('e13', encode('defghijklmnop') === 'ZGVmZ2hpamtsbW5vcA==');
    assert('e14', encode('qrstuvwxyz{|}~') === 'cXJzdHV2d3h5ent8fX4=');
    //assert.shouldThrow('cannot encode non-ASCII input', function() {
    //  encode('✈');
    //});
  });


  testSuite('decode base64', function() {
    var decode = function(str) {
      return new Buffer(str, 'base64').toString('ascii');
    };
    assert('[empty]', decode('') === '');
    assert('d1', decode('Zg==') === 'f');
    assert('d2', decode('Zm8=') === 'fo');
    assert('d3', decode('Zm9v') === 'foo');
    assert('d4', decode('cXV1eA==') === 'quux');
    assert('d5', decode('ISIjJCU=') === '!"#$%');
    assert('d6', decode('JicoKSor') === "&'()*+");
    assert('d7', decode('LC0uLzAxMg==') === ',-./012');
    assert('d8', decode('MzQ1Njc4OTo=') === '3456789:');
    assert('d9', decode('Ozw9Pj9AQUJD') === ';<=>?@ABC');
    assert('d10', decode('REVGR0hJSktMTQ==') === 'DEFGHIJKLM');
    assert('d11', decode('Tk9QUVJTVFVWV1g=') === 'NOPQRSTUVWX');
    assert('d12', decode('WVpbXF1eX2BhYmM=') === 'YZ[\\]^_`abc');
    assert('d13', decode('ZGVmZ2hpamtsbW5vcA==') === 'defghijklmnop');
    assert('d14', decode('cXJzdHV2d3h5ent8fX4=') === 'qrstuvwxyz{|}~');
    //assert.shouldThrow('cannot decode invalid input', function() {
    //  decode('a');
    //});
  });

  //strange bug where this would equal 2MQ=VPJb
  assert('base64 special case', new Buffer('d8c40054f25b', 'hex').toString('base64') ==='2MQAVPJb');

});