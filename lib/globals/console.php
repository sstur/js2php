<?php
$console = call_user_func(function() {

  $console = new Object();

  $console->set('log', new Func(function($this_, $arguments) {
    $len = $arguments->get('length');
    $args = $arguments->args;
    $output = array();
    for ($i = 0; $i < $len; $i++) {
      $output[] = to_string($args[$i]);
    }
    echo join(' ', $output) . "\n";
  }));

  return $console;
});
