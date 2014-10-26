<?php
$console = call_user_func(function() {

  $stdout = defined('STDOUT') ? STDOUT : null;
  $stderr = defined('STDERR') ? STDERR : null;

  $toString = function($args) {
    $output = array();
    foreach ($args as $value) {
      if ($value instanceof Object) {
        $toString = $value->get('inspect');
        if (!($toString instanceof Func)) {
          $toString = $value->get('toString');
        }
        if (!($toString instanceof Func)) {
          $toString = Object::$protoObject->get('toString');
        }
        $value = $toString->call($value);
      } else {
        $value = to_string($value);
      }
      $output[] = $value;
    }
    return join(' ', $output) . "\n";
  };

  $console = new Object();

  $console->set('log', new Func(function($this_, $arguments) use (&$stdout, &$toString) {
    if ($stdout === null) {
      $stdout = fopen('php://stdout', 'w');
    }
    $output = $toString($arguments->args);
    write_all($stdout, $output);
  }));

  $console->set('error', new Func(function($this_, $arguments) use (&$stderr, &$toString) {
    if ($stderr === null) {
      $stderr = fopen('php://stderr', 'w');
    }
    $output = $toString($arguments->args);
    write_all($stderr, $output);
  }));

  return $console;
});
