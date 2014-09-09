<?php
$console = call_user_func(function() {

  $toString = function($args) {
    $len = count($args);
    $output = array();
    for ($i = 0; $i < $len; $i++) {
      $output[] = to_string($args[$i]);
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
