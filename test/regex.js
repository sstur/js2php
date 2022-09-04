/*global global, testSuite*/
testSuite('regex', function (assert) {
  testSuite('string.match with global', function () {
    var s = 'xabcabdabe';
    var r = /a(b)([^b])/g;
    var m = s.match(r);
    assert('', m.join() === 'abc,abd,abe');
    assert('', m.index === undefined);
    assert('', m.input === undefined);
  });

  testSuite('string.match without global', function () {
    var s = 'xabcabdabe';
    var r = /a(b)([^b])/;
    var m = s.match(r);
    assert('', m.join(',') === 'abc,b,c');
    assert('', m.index === 1);
    assert('', m.input === s);
  });

  testSuite('string.match non-match without global', function () {
    var s = 'a';
    var hex = s.codePointAt(0).toString(16);
    assert("hex value of 'a' must be 61", hex === '61');
    assert("/\\u0061/ should match 'a'", s.match(/\u0061/) !== null);
    var r = /[\u007F-\uFFFF]/;
    var m = s.match(r);
    assert("/[\\u007F-\\uFFFF]/ should not match 'a'", m === null);
  });

  testSuite('string.match non-match with global', function () {
    var s = 'a';
    var r = /[\\"\$\x00-\x1F\u007F-\uFFFF]/g;
    var m = s.match(r);
    assert('', m === null);
  });

  testSuite('string.replace non-match with global', function () {
    var s = '\f\n\r\t\v\xA0abc\xA0\v\t\r\n\f';
    var r = /[\\"\$\x00-\x1F\u007F-\uFFFF]/g;
    var replaced = s.replace(r, function (char) {
      return '';
    });
    assert('', replaced === 'abc');
  });

  testSuite('regex.test', function () {
    assert(
      "/^(true|false)$/.test('true')",
      /^(true|false)$/.test('true') === true
    );
    assert(
      "/^(true|false)$/.test('abc')",
      /^(true|false)$/.test('abc') === false
    );
    assert(
      '/^(true|false)$/.test(null)',
      /^(true|false)$/.test(null) === false
    );
  });
});
