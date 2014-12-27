<?php
$console = call_user_func(function() {

  $stdout = defined('STDOUT') ? STDOUT : null;
  $stderr = defined('STDERR') ? STDERR : null;

  $toString = function($value) {
    if ($value instanceof Object) {
      if (class_exists('Debug')) {
        //should be ok to call the underlying function directly
        return call_user_func(Debug::$inspect->fn, $value);
      }
      $toString = $value->get('inspect');
      if (!($toString instanceof Func)) {
        $toString = $value->get('toString');
      }
      if (!($toString instanceof Func)) {
        $toString = Object::$protoObject->get('toString');
      }
      return $toString->call($value);
    }
    return to_string($value);
  };

  $console = new Object();

  $console->set('log', new Func(function() use (&$stdout, &$toString) {
    if ($stdout === null) {
      $stdout = fopen('php://stdout', 'w');
    }
    $output = array();
    foreach (func_get_args() as $value) {
      $output[] = $toString($value);
    }
    write_all($stdout, join(' ', $output) . "\n");
  }));

  $console->set('error', new Func(function() use (&$stderr, &$toString) {
    if ($stderr === null) {
      $stderr = fopen('php://stderr', 'w');
    }
    $output = array();
    foreach (func_get_args() as $value) {
      $output[] = $toString($value);
    }
    write_all($stderr, join(' ', $output) . "\n");
  }));

  return $console;
});
