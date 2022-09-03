/*global global, testSuite*/
testSuite('dates', function (assert) {
  testSuite('construct with no args', function () {
    var date = new Date();
    assert(
      'has some reasonably recent time value',
      date.valueOf() > 1419750026906
    );
    // pause for 10 milliseconds (defined in tests.php)
    /*process.sleep(10);
    var date2 = new Date();
    var difference = date2.valueOf() - date.valueOf();
    assert('dates are close to 10ms appart', difference > 0 && difference < 20);*/
  });

  testSuite('construct with ms', function () {
    var date = new Date(1419750026906);
    assert(
      'toGMTString',
      date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT'
    );
    assert('toJSON', date.toJSON() === '2014-12-28T07:00:26.906Z');
    /*assert(
      'toString',
      date.toString() === 'Sun Dec 28 2014 00:00:26 GMT-0700 (MST)'
    );*/
  });

  testSuite('construct from string', function () {
    var date = new Date('Sun, 28 Dec 2014 07:00:26 GMT');
    assert(
      'gmt string',
      date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT'
    );
    date = new Date('2014-12-28T07:00:26.906Z');
    assert(
      'json (utc) string',
      date.toGMTString() === 'Sun, 28 Dec 2014 07:00:26 GMT'
    );
    // if we specify a [partial] date string that looks like ISO-8601 it should be interpreted as UTC
    date = new Date('2014-12-07');
    /*assert(
      'date-only, iso-8601',
      date.toLocaleString() === '12/6/2014, 5:00:00 PM'
    );*/
    // this date includes a time and should be interpreted as local
    date = new Date('12/07/2014, 12:00 AM');
    /*assert('date, local', date.toLocaleString() === '12/7/2014, 12:00:00 AM');*/
  });

  testSuite('construct from string with only date specified', function () {
    var date = new Date('2014-12-28');
    assert('iso string', date.toISOString() === '2014-12-28T00:00:00.000Z');
    /*assert(
      'local string',
      date.toString() === 'Sat Dec 27 2014 17:00:00 GMT-0700 (MST)'
    );*/
  });

  testSuite('construct from UTC', function () {
    var ms = Date.UTC(2013, 7, 5, 18, 11, 8, 411);
    assert('Date.UTC', ms === 1375726268411);
    var date = new Date(ms);
    assert('toJSON', date.toJSON() === '2013-08-05T18:11:08.411Z');
    /*assert(
      'toString',
      date.toString() === 'Mon Aug 05 2013 11:11:08 GMT-0700 (MST)'
    );*/
  });
});
