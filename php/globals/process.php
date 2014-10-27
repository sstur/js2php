<?php
$process = new Object();

$process->definitions = array();
$process->modules = array();

$process->define = function($name, $fn) use (&$process) {
  $process->definitions[$name] = $fn;
};

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($this_, $arguments, $code = 0) {
  $code = intval($code);
  exit($code);
}));

$process->set('binding', new Func(function($this_, $arguments, $name) {
  if (isset($this_->modules[$name])) {
    return $this_->modules[$name];
  }
  if (isset($this_->definitions[$name])) {
    $module = $this_->definitions[$name]();
    $this_->modules[$name] = $module;
    return $module;
  }
  throw new Ex(Error::create("Binding `$name` not found."));
}));
