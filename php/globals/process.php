<?php
$process = new Object();

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($code = 0) {
  $code = intval($code);
  exit($code);
}));

$process->set('binding', new Func(function($name) {
  $module = Module::get($name);
  if ($module === null) {
    throw new Ex(Error::create("Binding `$name` not found."));
  }
  return $module;
}));

//command line arguments
$process->argv = isset(GlobalObject::$OLD_GLOBALS['argv']) ? GlobalObject::$OLD_GLOBALS['argv'] : array();
//first argument is path to script
$process->argv = array_slice($process->argv, 1);
$process->set('argv', Arr::fromArray($process->argv));
