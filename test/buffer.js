/*global global, testSuite*/
(function() {

  testSuite('buffer', function(assert) {

    var atob = function(str) {
      return new Buffer(str, 'base64').toString('ascii');
    };
    var btoa = function(str) {
      return new Buffer(str, 'ascii').toString('base64');
    };

    testSuite('can encode ascii', function() {
      assert('[empty]', btoa('') === '');
      assert('e1', btoa('f') === 'Zg==');
      assert('e2', btoa('fo') === 'Zm8=');
      assert('e3', btoa('foo') === 'Zm9v');
      assert('e4', btoa('quux') === 'cXV1eA==');
      assert('e5', btoa('!"#$%') === 'ISIjJCU=');
      assert('e6', btoa("&'()*+") === 'JicoKSor');
      assert('e7', btoa(',-./012') === 'LC0uLzAxMg==');
      assert('e8', btoa('3456789:') === 'MzQ1Njc4OTo=');
      assert('e9', btoa(';<=>?@ABC') === 'Ozw9Pj9AQUJD');
      assert('e10', btoa('DEFGHIJKLM') === 'REVGR0hJSktMTQ==');
      assert('e11', btoa('NOPQRSTUVWX') === 'Tk9QUVJTVFVWV1g=');
      assert('e12', btoa('YZ[\\]^_`abc') === 'WVpbXF1eX2BhYmM=');
      assert('e13', btoa('defghijklmnop') === 'ZGVmZ2hpamtsbW5vcA==');
      assert('e14', btoa('qrstuvwxyz{|}~') === 'cXJzdHV2d3h5ent8fX4=');
    });

    //assert.shouldThrow('cannot encode non-ASCII input', function() {
    //  btoa('✈');
    //});

    testSuite('can decode base64', function() {
      assert('[empty]', atob('') === '');
      assert('d1', atob('Zg==') === 'f');
      assert('d2', atob('Zm8=') === 'fo');
      assert('d3', atob('Zm9v') === 'foo');
      assert('d4', atob('cXV1eA==') === 'quux');
      assert('d5', atob('ISIjJCU=') === '!"#$%');
      assert('d6', atob('JicoKSor') === "&'()*+");
      assert('d7', atob('LC0uLzAxMg==') === ',-./012');
      assert('d8', atob('MzQ1Njc4OTo=') === '3456789:');
      assert('d9', atob('Ozw9Pj9AQUJD') === ';<=>?@ABC');
      assert('d10', atob('REVGR0hJSktMTQ==') === 'DEFGHIJKLM');
      assert('d11', atob('Tk9QUVJTVFVWV1g=') === 'NOPQRSTUVWX');
      assert('d12', atob('WVpbXF1eX2BhYmM=') === 'YZ[\\]^_`abc');
      assert('d13', atob('ZGVmZ2hpamtsbW5vcA==') === 'defghijklmnop');
      assert('d14', atob('cXJzdHV2d3h5ent8fX4=') === 'qrstuvwxyz{|}~');
    });

    //assert.shouldThrow('cannot decode invalid input', function() {
    //  atob('a');
    //});

    //strange bug where this would equal 2MQ=VPJb
    assert('special case', new Buffer('d8c40054f25b', 'hex').toString('base64') ==='2MQAVPJb');

  });

})();