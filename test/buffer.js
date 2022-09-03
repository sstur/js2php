/*global global, testSuite, Buffer*/
testSuite('buffer', function (assert) {
  testSuite('strings', function () {
    var b = new Buffer('sa');
    assert('string without encoding specified', b.toString() === 'sa');
    b = new Buffer('sa', 'utf8');
    assert('string with utf8', b.toString() === 'sa');
    assert('string with utf8 length', b.length === 2);
    b = new Buffer('↗Զ');
    assert('string with utf8 extended', b.toString() === '↗Զ');
    assert('string with utf8 extended length', b.length === 5);
  });

  /*
  testSuite('binary', function () {
    var b = new Buffer(2);
    assert('length', b.length === 2);
    assert('index access', b.get(1) === 0);
    assert.shouldThrow('get invalid offset', function () {
      b.get(2);
    });
    b.set(0, 97);
    b.set(1, 98);
    assert('can set bytes', b.toString() === 'ab');
    assert.shouldThrow('set invalid offset', function () {
      b.set(-1, 0);
    });
  });
  */
  testSuite('slice', function () {
    var b = new Buffer('abcdefghi');
    assert('one char slice', b.slice(0, 1).toString() === 'a');
    assert('middle slice', b.slice(1, 3).toString() === 'bc');
    assert('end slice', b.slice(2).toString() === 'cdefghi');
    assert('neg start', b.slice(-2).toString() === 'hi');
    assert('neg start, pos end', b.slice(-2, 8).toString() === 'h');
    assert('neg start, neg end', b.slice(-2, -1).toString() === 'h');
    assert('pos start, neg end', b.slice(1, -1).toString() === 'bcdefgh');
  });

  testSuite('Buffer.concat', function () {
    var a = new Buffer('010203', 'hex');
    var b = new Buffer('0405', 'hex');
    assert('a length', a.length === 3);
    assert('b length', b.length === 2);
    var c = Buffer.concat([a, b]);
    assert('c length', c.length === 5);
    assert('c content', c.toString('hex') === '0102030405');
    assert(
      'length equal',
      Buffer.concat([a, b], 5).toString('hex') === '0102030405'
    );
    assert(
      'length greater',
      Buffer.concat([a, b], 6).toString('hex') === '010203040500'
    );
    assert(
      'length less',
      Buffer.concat([a, b], 4).toString('hex') === '01020304'
    );
  });

  testSuite('write', function () {
    var chunks = ['010203', '0405'];
    var totalLength = 0;
    chunks.forEach(function (chunk) {
      totalLength += Buffer.byteLength(chunk, 'hex');
    });
    var i, output, buf;

    //test: write(buffer, offset)
    i = 0;
    output = new Buffer(totalLength);
    /*chunks.forEach(function (chunk) {
      output.write(new Buffer(chunk, 'hex'), i);
      i += Buffer.byteLength(chunk, 'hex');
    });
    assert('write(buffer, offset)', output.toString('hex') === chunks.join(''));*/

    //test: write(string, offset, enc)
    i = 0;
    output = new Buffer(totalLength);
    chunks.forEach(function (chunk) {
      output.write(chunk, i, 'hex');
      i += Buffer.byteLength(chunk, 'hex');
    });
    assert(
      'write(string, offset, enc)',
      output.toString('hex') === chunks.join('')
    );

    //test: write(string, enc, offset)
    /*
    i = 0;
    output = new Buffer(totalLength);
    chunks.forEach(function (chunk) {
      output.write(chunk, 'hex', i);
      i += Buffer.byteLength(chunk, 'hex');
    });
    assert(
      'write(string, enc, offset)',
      output.toString('hex') === chunks.join('')
    );
    */

    //write(string, enc)
    buf = new Buffer('abcdef');
    buf.write('xx', 'ascii');
    assert('write(string, enc)', buf.toString() === 'xxcdef');

    //write(string, enc, offset)
    /*
    buf = new Buffer('abcdef');
    buf.write('xx', 'ascii', 2);
    assert('write(string, enc, offset)', buf.toString() === 'abxxef');*/

    //write(string, enc, offset, len)
    /*
    buf = new Buffer('abcdef');
    buf.write('xxyy', 'ascii', 2, 2);
    assert('write(string, enc, offset, len)', buf.toString() === 'abxxef');*/

    //write(data, offset)
    /*
    buf.write('__', 0);
    assert('write(data, offset)', buf.toString() === '__xxef');*/

    //write(data, offset, len)
    /*buf.write('---', 4, 2);
    assert('write(data, offset, len)', buf.toString() === '__xx--');*/

    //write(data, offset, len, enc)
    /*buf.write('78787979', 4, 2, 'hex');
    assert('write(data, offset, len, enc)', buf.toString() === '__xxxx');*/

    //write(data, offset, enc, len)
    buf.write('78787979', 0, 'hex', 2);
    /*assert('write(data, offset, enc, len)', buf.toString() === 'xxxxxx');*/
  });

  testSuite('encode hex', function () {
    var encode = function (str) {
      return new Buffer(str).toString('hex');
    };
    assert('[empty]', encode('') === '');
    assert('e1', encode('abc') === '616263');
    assert('e2', encode('\x00') === '00');
  });

  testSuite('decode hex', function () {
    var decode = function (str) {
      return new Buffer(str, 'hex').toString('ascii');
    };
    assert('[empty]', decode('') === '');
    assert('d1', decode('616263') === 'abc');
    assert('d2', decode('00') === '\x00');
  });

  testSuite('encode base64', function () {
    var encode = function (str) {
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

  testSuite('decode base64', function () {
    var decode = function (str) {
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
  assert(
    'base64 special case',
    new Buffer('d8c40054f25b', 'hex').toString('base64') === '2MQAVPJb'
  );
});
