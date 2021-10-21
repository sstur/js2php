/*global global, testSuite*/
testSuite('booleans', function (assert) {
  testSuite('simple', function () {
    assert('true', Boolean(true) === true);
    assert('falsey', Boolean(0) === false);
    assert('truthy', Boolean(5) === true);
  });

  testSuite('object', function () {
    assert(
      'new Boolean().valueOf() === false',
      new Boolean().valueOf() === false
    );
  });
});
