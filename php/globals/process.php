<?php
$process = new Object();

$process->definitions = array();
$process->modules = array();

$process->define = function($name, $fn) use (&$process) {
  $process->definitions[$name] = $fn;
};

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($code = 0) {
  $code = intval($code);
  exit($code);
}));

$process->set('binding', new Func(function($name) {
  $self = $this->context;
  if (isset($self->modules[$name])) {
    return $self->modules[$name];
  }
  if (isset($self->definitions[$name])) {
    $module = $self->definitions[$name]();
    $self->modules[$name] = $module;
    return $module;
  }
  throw new Ex(Error::create("Binding `$name` not found."));
}));

//command line arguments
$process->argv = isset(GlobalObject::$OLD_GLOBALS['argv']) ? GlobalObject::$OLD_GLOBALS['argv'] : array();
//first argument is path to script
$process->argv = array_slice($process->argv, 1);
$process->set('argv', Arr::fromArray($process->argv));
