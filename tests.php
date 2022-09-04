<?php
require_once('runtime.php');

$process->setMethods(array(
  //used to test dates
  'sleep' => function($ms) {
      usleep($ms * 1000);
    }
));

//set some implicit globals
$foo = 'test';
$«24» = '$';
$«c3»«bc»r = 'ür';

call_method($console, 'log', 'Begin', 'Tests:');

Test::suite(
  'null',
  function() {
    Test::assert(
      'is falsy',
      is(Obj::$null) ? false : true
    );
    Test::assert(
      'check typeof',
      _typeof(Obj::$null) === 'object'
    );
    Test::assert(
      'check to_string',
      to_string(Obj::$null) === 'null'
    );
  }
);

Test::suite(
  'global',
  function() {
    Test::assert(
      'props reflect global vars',
      Obj::$global->get('foo') === 'test'
    );
    Obj::$global->set('foo', 'test2');
    Test::assert(
      'can set global',
      Obj::$global->get('foo') === 'test2'
    );
    Obj::$global->set('foo2', 'bar');
    Test::assert(
      'can set global which was previously not set',
      Obj::$global->get('foo2') === 'bar'
    );
    Test::assert(
      'has circular ref',
      Obj::$global->get('global') === Obj::$global
    );
    Test::assert(
      'can access escaped vars',
      Obj::$global->get('$') === $GLOBALS['«24»']
    );
    Test::assert(
      'can access escaped vars unicode',
      Obj::$global->get('ür') === 'ür'
    );
  }
);

Test::suite(
  'Object.prototype',
  function() use ($Object) {
    Test::assert(
      'has method valueOf',
      Obj::$protoObject->get('valueOf') instanceof Func
    );
    Test::assert(
      '__proto__ is null',
      Obj::$protoObject->proto === Obj::$null
    );
    Test::assert(
      'check toString',
      $Object->get('prototype')->get('toString') === Obj::$protoObject->get('toString')
    );
  }
);

Test::suite(
  'keys()',
  function() use ($Object) {
    $obj = $Object->construct();
    $obj->set('a', true);
    $obj->set('b', false);
    $keys = keys($obj);
    sort($keys, SORT_STRING);
    Test::assert('basic keys', join(',', $keys) === 'a,b');
    $child = $Object->callMethod('create', $obj);
    $child->set('c', 'foo');
    $keys = keys($child);
    sort($keys, SORT_STRING);
    Test::assert('inherited keys', join(',', $keys) === 'a,b,c');
  }
);

Test::suite(
  'Object',
  function() use ($Object) {
    $o = new Obj("a", 1.0, "b", 2.0);
    Test::assert(
      'data present',
      join(',', array_keys($o->data)) === 'a,b'
    );
    Test::assert(
      'descriptors not present',
      join(',', array_keys($o->dscr)) === ''
    );
    $o->setProp('c', 3.0, true, false, true);
    Test::assert(
      'three keys',
      join(',', array_keys($o->data)) === 'a,b,c'
    );
    Test::assert(
      'descriptors present',
      join(',', array_keys($o->dscr)) === 'c'
    );
    _delete($o, 'c');
    Test::assert(
      'descriptors now empty',
      join(',', array_keys($o->dscr)) === ''
    );
    Test::assert(
      'keys now two',
      join(',', array_keys($o->data)) === 'a,b'
    );
    $o = new Obj("a", 1.0, "b", 2.0);
    Test::assert(
      'for..in helper',
      join(',', keys($o)) === 'a,b'
    );
  }
);

Test::suite(
  'Array.prototype',
  function() use ($Object, $Array) {
    Test::assert(
      'should be distinct from Object.prototype',
      $Array->get('prototype') !== $Object->get('prototype')
    );
    Test::assert(
      'should be that of Arr',
      $Array->get('prototype') === Arr::$protoObject
    );
  }
);

Test::suite(
  'Array: init, push and join',
  function() use ($Array) {
    $arr = $Array->construct();
    $arr->set(0.0, 'a');
    Test::assert('proto exists', $arr->proto instanceof Obj);
    Test::assert('proto is set correctly', $arr->proto === $Array->get('prototype'));
    Test::assert('proto chain', $arr->proto->proto === Obj::$protoObject);
    Test::assert('is_int length', is_int($arr->length));
    $arr->remove('0');
    Test::assert('length', $arr->get('length') === 1.0);
    Test::assert('get', $arr->get(0) === null);
    Test::assert('push', call_method($arr, 'push', 9.0) === 2.0);
    Test::assert('length 2', $arr->get('length') === 2.0);
    Test::assert('join', call_method($arr, 'join', ';') === ';9');
    //implicit push
    $arr->set(2.0, 'x');
    Test::assert('length 3', $arr->get('length') === 3.0);
    Test::assert('join default', call_method($arr, 'join') === ',9,x');
  }
);

Test::suite(
  'Array: set length',
  function() use ($Array) {
    $arr = $Array->construct(1.0, 2.0);
    Test::assert('length', $arr->get('length') === 2.0);
    $arr->set('length', 3.0);
    Test::assert('implicit element', $arr->get(2) === null);
    $arr->set('2', 3.0);
    Test::assert('explicit element', $arr->get(2) === 3.0);
    $arr->set('length', 2);
    Test::assert('implicit element removal', $arr->get(2) === null);
  }
);

Test::suite(
  'Array: sort',
  function() use ($Array) {
    $arr = $Array->construct('s', 'i', false, 'm');
    $arr->callMethod('sort');
    Test::assert('length', $arr->get('length') === 4.0);
    Test::assert('sorted', $arr->callMethod('join', ',') === 'false,i,m,s');
    Test::assert('types', $arr->get(0) === false);
  }
);

Test::suite(
  'Function',
  function() use ($Array) {
    $fn = new Func('foo', function() {
      return 'bar';
    });
    Test::assert('Function should take optional name', $fn->get('name') === 'foo');
    $fn->set('name', 'x');
    Test::assert('Function name is immutable', $fn->get('name') === 'foo');
    Test::assert('Function should run', $fn->call() === 'bar');
    $fn = new Func('foo', function() use (&$fn) {
      $self = Func::getContext();
      $arguments = Func::getArguments();
      Test::assert('arguments', $arguments instanceof Args);
      Test::assert('arguments.callee', $arguments->get('callee') === $fn);
      Test::assert('arguments is object', $arguments instanceof Obj);
      Test::assert('arguments is not array', !($arguments instanceof Arr));
      Test::assert('arguments has length', $arguments->get('length') === 0.0);
      Test::assert('this is global', $self === Obj::$global);
    });
    $fn->call();
    $fn = new Func('foo', function() use ($fn, $Array) {
      $self = Func::getContext();
      $arguments = Func::getArguments();
      Test::assert('arguments length', $arguments->get('length') === 1.0);
      Test::assert('arguments -> args', join(',', $arguments->args) === 'foo');
      Test::assert('this is global', $self === $Array);
    });
    $fn->call($Array, 'foo');
  }
);

Test::suite(
  'Object.create',
  function() use ($Object) {
    $Animal = new Func(function() {});
    $Animal->get('prototype')->set('speak', new Func(function() {
      return 'hi';
    }));
    $Dog = new Func(function() {});
    $Dog->set('prototype', $Object->callMethod('create', $Animal->get('prototype')));
    $dog = $Dog->construct();
    Test::assert('has method', $dog->get('speak') instanceof Func);
    Test::assert('method call', $dog->callMethod('speak') === 'hi');
    Test::assert('proto inherit', _instanceof($dog, $Dog));
    Test::assert('proto inherit parent', _instanceof($dog, $Animal));
    Test::assert('proto inherit top', _instanceof($dog, $Object));
    $Thing = new Func(function() {});
    Test::assert('proto not instance foreign', !_instanceof($dog, $Thing));
    $Dog->get('prototype')->set('speak', new Func(function() {
      return 'woof';
    }));
    Test::assert('method override', $dog->callMethod('speak') === 'woof');
    $animal = $Animal->construct();
    Test::assert('method still on parent', $animal->callMethod('speak') === 'hi');
  }
);

Test::suite(
  'Object.keys',
  function() use ($Object, $Array, $JSON) {
    $obj = $Object->construct();
    $obj->set('a', 1.0);
    $obj->set('b', 2.0);
    $keys = $Object->callMethod('keys', $obj);
    Test::assert('basic keys', $keys->callMethod('toString') === 'a,b');
    $arr = new Arr(1.0, 2.0);
    $keys = $Object->callMethod('keys', $arr);
    Test::assert('only enumerable keys', $keys->callMethod('toString') === '0,1');
  }
);

Test::suite(
  'Object.defineProperty',
  function() use ($Object) {
    $obj = $Object->construct();
    $obj->set('a', 1.0);
    $descriptor = new Obj('enumerable', false);
    $Object->callMethod('defineProperty', $obj, 'foo', $descriptor);
    $keys = $Object->callMethod('keys', $obj);
    Test::assert('key is not enumerable', $keys->callMethod('toString') === 'a');
    $props = new Obj('bar', $descriptor, 'baz', $descriptor);
    $Object->callMethod('defineProperties', $obj, $props);
    $keys = $Object->callMethod('keys', $obj);
    Test::assert('defineProperties worked', $keys->callMethod('toString') === 'a');
    $keys = $Object->callMethod('getOwnPropertyNames', $obj);
    Test::assert('keys are present', $keys->callMethod('toString') === 'a,foo,bar,baz');
  }
);

//todo: move this to js-land
Test::suite(
  'Date',
  function() use ($Date, $Object, $Array) {
    $date = new Date(2013, 7, 5, 18, 11, 8, 411);
    //this is based on timezone 'America/Phoenix' which we hard-code for tests
    Test::assert('date value', $date->value === 1375751468411);
    Test::assert('date valueOf', (float)($date->value) === $date->callMethod('valueOf'));
    Test::assert('date local string', $date->callMethod('toString') === 'Mon Aug 05 2013 18:11:08 GMT-0700 (MST)');
    Test::assert('date json string', $date->callMethod('toJSON') === '2013-08-06T01:11:08.411Z');
    $date = new Date(1375751468412.0);
    Test::assert('init from value', $date->callMethod('toJSON') === '2013-08-06T01:11:08.412Z');
    $date = new Date('2013-08-06T01:11:08.412Z');
    Test::assert('init from string', $date->callMethod('toJSON') === '2013-08-06T01:11:08.412Z');
  }
);

Test::suite(
  'RegExp',
  function() use ($RegExp, $Object, $Array) {
    $str = 'xabcdef';
    $reg = new RegExp('a(b|c)', 'i');
    Test::assert('reg source', $reg->get('source') === 'a(b|c)');
    Test::assert('reg toString', $reg->callMethod('toString') === '/a(b|c)/i');
    $match = $reg->callMethod('exec', $str);
    Test::assert('match result', $match->get(0) === 'ab');
    Test::assert('match length', $match->get('length') === 2.0);
    Test::assert('match index', $match->get('index') === 1.0);
    Test::assert('match input', $match->get('input') === $str);
    Test::assert('match lastIndex', $reg->get('lastIndex') === 3.0);
  }
);

Test::suite(
  'String object',
  function() use ($String, $Object) {
    $str = $String->construct('hi');
    Test::assert('instanceof', $str instanceof Str);
    Test::assert('type is object', _typeof($str) === 'object');
    Test::assert('has value', $str->value === 'hi');
    Test::assert('has value', $str->callMethod('toString') === 'hi');
    Test::assert('has value', $str->callMethod('charAt', 0) === 'h');
    $str = $String->call(null, 'hi');
    Test::assert('is not object', !($str instanceof Str));
    Test::assert('primitive', _typeof($str) === 'string');
    Test::assert('can call on primitive', call_method($str, 'charAt', 0) === 'h');
  }
);

Test::suite(
  'Number helpers',
  function() use ($Number) {
    Test::assert('to_number ""', to_number('') === 0.0);
    Test::assert('to_number "x"', is_nan(to_number('x')));
    Test::assert('to_number "+0"', to_number('+0') === 0.0);
    Test::assert('to_number "+Infinity"', to_number('+Infinity') === INF);
    Test::assert('to_number "+1234.5678"', to_number('+1234.5678') === to_number('1234.5678'));
    Test::assert('to_number "+1234.5678e90"', to_number("+1234.5678e90") === to_number("1234.5678e90"));
    Test::assert('to_number "+1234.5678E90"', to_number("+1234.5678E90") === to_number("1234.5678E90"));
    Test::assert('to_number "+1234.5678e-90"', to_number("+1234.5678e-90") === to_number("1234.5678e-90"));
    Test::assert('to_number "+1234.5678E-90"', to_number("+1234.5678E-90") === to_number("1234.5678E-90"));
  }
);

Test::suite(
  'Number object',
  function() use ($Number, $Object) {
    $num = $Number->construct(5.0);
    Test::assert('instanceof', $num instanceof Number);
    Test::assert('type is object', _typeof($num) === 'object');
    Test::assert('has value', $num->value === 5.0);
    Test::assert('to string', $num->callMethod('toString') === '5');
    $num = $Number->call(null, '5');
    Test::assert('is not object', !($num instanceof Str));
    Test::assert('primitive', _typeof($num) === 'number');
    Test::assert('can call on primitive', call_method($num, 'toString') === '5');
    $num = $Number->call(null, '');
    Test::assert('empty coerced', $num === 0.0);
    $num = $Number->callMethod('parseInt', '5.x');
    Test::assert('parseInt 1', $num === 5.0);
    $num = $Number->callMethod('parseInt', '+05.1');
    Test::assert('parseInt 2', $num === 5.0);
    $num = $Number->callMethod('parseInt', ' -15.0');
    Test::assert('parseInt 3', $num === -15.0);
    $num = $Number->callMethod('parseInt', 'x');
    Test::assert('parseInt 4', is_nan($num));
    $num = $Number->callMethod('parseFloat', '-05e2x');
    Test::assert('parseFloat 1', $num === -500.0);
    $num = $Number->callMethod('parseFloat', ' +05.0');
    Test::assert('parseFloat 2', $num === 5.0);
    $num = $Number->callMethod('parseFloat', 'x');
    Test::assert('parseFloat 3', is_nan($num));
    $num = $Number->callMethod('parseFloat', '8.64e15');
    Test::assert('parseFloat 4', $num === 8.64e15);
  }
);

Test::suite(
  'JSON',
  function() use ($JSON, $Object, $Array) {
    $str = '{"a": [1], "b": false, "c": []}';
    $obj = $JSON->callMethod('parse', $str);
    Test::assert('parsed empty array', $obj->get('c')->get('length') === 0.0);
    Test::assert('parsed array', $obj->get('a')->get(0) === 1.0);
    Test::assert('parsed boolean', $obj->get('b') === false);
    $str2 = $JSON->callMethod('stringify', $obj);
    Test::assert('stringify', $str2 === '{"a":[1],"b":false,"c":[]}');
  }
);

require_once('test/compiled/helpers.php');
require_once('test/compiled/core.php');
require_once('test/compiled/number.php');
require_once('test/compiled/boolean.php');
require_once('test/compiled/string.php');
require_once('test/compiled/date.php');
require_once('test/compiled/regex.php');
require_once('test/compiled/array.php');
require_once('test/compiled/buffer.php');
require_once('test/compiled/json.php');
//require_once('test/compiled/module-fs.php');
require_once('test/compiled/module-path.php');

$console->callMethod('log', 'Success');
