<?php
$console = call_user_func(function() {

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

  $console->set('log', new Func(function($this_, $arguments) use ($toString) {
    $output = $toString($arguments->args);
    fwrite(STDOUT, $output);
  }));

  $console->set('error', new Func(function($this_, $arguments) use ($toString) {
    $output = $toString($arguments->args);
    fwrite(STDERR, $output);
  }));

  return $console;
});
