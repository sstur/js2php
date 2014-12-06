/*global global, testSuite*/
testSuite('regex', function(assert) {

  testSuite('string.match with global', function() {
    var s = 'xabcabdabe';
    var r = /a(b)([^b])/g;
    var m = s.match(r);
    assert('', m.join() === 'abc,abd,abe');
    assert('', m.index === undefined);
    assert('', m.input === undefined);
  });

  testSuite('string.match without global', function() {
    var s = 'xabcabdabe';
    var r = /a(b)([^b])/;
    var m = s.match(r);
    assert('', m.join(',') === 'abc,b,c');
    assert('', m.index === 1);
    assert('', m.input === s);
  });

});
