/*global global, testSuite*/
testSuite('numbers', function(assert) {

  testSuite('NaN and Infinity', function() {
    assert('NaN global', 'NaN' in global);
    assert('Number.NaN', NaN.toString() === Number.NaN.toString());
    assert('Number.NaN', String(NaN) === String(Number.NaN));
    assert('isNaN', isNaN(NaN));
    assert('non-equality', NaN !== NaN);
    assert('Positive Infinity', Number.POSITIVE_INFINITY === Infinity);
    assert('Negative Infinity', Number.NEGATIVE_INFINITY === -Infinity);
  });

  testSuite('coercion', function() {
    assert('Number()', Number() === 0);
    assert('Number(null)', Number(null) === 0);
    assert('Number(undefined)', isNaN(Number(undefined)));
  });

  testSuite('operators', function() {
    //coercion
    assert('"2" < "a"', '2' < 'a' === true);
    assert('2 < "a"', 2 < 'a' === false);
    assert("str + 1", 'x' + 1 === 'x1');
    assert("str - 1", isNaN('x' - 1));
  });

});
