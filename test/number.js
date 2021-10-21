/*global global, testSuite*/
testSuite('numbers', function (assert) {
  testSuite('plus', function () {
    assert('float to int', 1.5 + 1.5 === 3);
  });

  testSuite('object', function () {
    assert('new Number().valueOf() === 0', new Number().valueOf() === 0);
  });

  testSuite('divide', function () {
    assert('3 / 2', 3 / 2 === 1.5);
    assert('3 / 0', 3 / 0 === Infinity);
    assert('-3 / 0', -3 / 0 === -Infinity);
    assert('0 / 0', String(0 / 0) === 'NaN');
  });

  testSuite('NaN and Infinity', function () {
    assert('NaN global', 'NaN' in global);
    assert('Number.NaN', NaN.toString() === Number.NaN.toString());
    assert('Number.NaN', String(NaN) === String(Number.NaN));
    assert('isNaN', isNaN(NaN));
    assert('non-equality', NaN !== NaN);
    assert('Positive Infinity', Number.POSITIVE_INFINITY === Infinity);
    assert('Negative Infinity', Number.NEGATIVE_INFINITY === -Infinity);
  });

  testSuite('coercion', function () {
    assert('Number()', Number() === 0);
    assert('Number(null)', Number(null) === 0);
    assert('Number(undefined)', isNaN(Number(undefined)));
  });

  testSuite('operator coercion', function () {
    assert('"2" < "a"', '2' < 'a' === true);
    assert('2 < "a"', 2 < 'a' === false);
    assert('str + 1', 'x' + 1 === 'x1');
    assert('str - 1', isNaN('x' - 1));
  });

  testSuite('numeric literals', function () {
    assert('0xFFF === 4095', 0xfff === 4095);
    assert('0123 === 83', 0123 === 83);
    assert('0o123 === 83', 0o123 === 83);
    assert('0b111 === 7', 0b111 === 7);
  });
});
