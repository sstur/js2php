<?php
$process = new Object();

$process->bindings = array();
$process->define = function($name, $value) use (&$process) {
  $process->bindings[$name] = $value;
};

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($this_, $arguments, $code = 0) {
  $code = intval($code);
  exit($code);
}));

$process->set('binding', new Func(function($this_, $arguments, $name) {
  if (isset($this_->bindings[$name])) {
    return $this_->bindings[$name];
  } else {
    throw new Ex(Error::create('Binding `$name` not found.'));
  }
}));
