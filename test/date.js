/*global global, testSuite*/
testSuite('dates', function(assert) {

  testSuite('construct with no args', function() {
    var date = new Date();
    assert('has some reasonably recent time value', date.valueOf() > 1419750026906);
    // pause for 10 milliseconds (defined in tests.php)
    process.sleep(10);
    var date2 = new Date();
    var difference = date2.valueOf() - date.valueOf();
    assert('dates are close to 10ms appart', difference > 0 && difference < 20);
  });

  testSuite('construct with ms', function() {
    var date = new Date(1419750026906);
    assert('toGMTString', date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT');
    assert('toJSON', date.toJSON() === '2014-12-28T07:00:26.906Z');
  });

  testSuite('construct from string', function() {
    var date = new Date('Sun, 28 Dec 2014 07:00:26 GMT');
    assert('gmt string', date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT');
    date = new Date('2014-12-28T07:00:26.906Z');
    assert('json (utc) string', date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT');
    // if we don't specify a time, spec-compliant js would parse as UTC
    date = new Date('12/07/2014, 12:00 AM');
    assert('date-only, local', date.toLocaleString() === '12/7/2014, 12:00:00 AM');
  });

});
