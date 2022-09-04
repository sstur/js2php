/*global global, process, Buffer, testSuite*/
testSuite('module-path', function (assert) {
  'use strict';

  var path = require('path');
  testSuite('join', function () {
    assert('path.join("a", "b")', path.join('a', 'b') === 'a/b');
    assert('path.join("..", "b")', path.join('..', 'b') === '../b');
  });
  testSuite('normalize', function () {
    assert(
      'path.normalize("test/a/../b")',
      path.normalize('test/a/../b') === 'test/b'
    );
  });
});
