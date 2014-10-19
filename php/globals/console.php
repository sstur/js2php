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

  //some platforms require multiple calls to fwrite
  $writeAll = function($stream, $data) {
    $bytesTotal = strlen($data);
    $bytesWritten = 0;
    while ($bytesWritten < $bytesTotal) {
      $bytesWritten += fwrite($stream, substr($data, $bytesWritten));
    }
  };

  $console = new Object();

  $console->set('log', new Func(function($this_, $arguments) use (&$stdout, &$toString, &$writeAll) {
    if ($stdout === null) {
      $stdout = fopen('php://stdout', 'w');
    }
    $output = $toString($arguments->args);
    $writeAll($stdout, $output);
  }));

  $console->set('error', new Func(function($this_, $arguments) use (&$stderr, &$toString, &$writeAll) {
    if ($stderr === null) {
      $stderr = fopen('php://stderr', 'w');
    }
    $output = $toString($arguments->args);
    $writeAll($stderr, $output);
  }));

  return $console;
});
