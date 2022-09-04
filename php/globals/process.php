<?php
$process = new Obj();

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($code = 0) {
  $code = intval($code);
  exit($code);
}));

$process->set('sleep', new Func(function($ms = 0) {
  sleep($ms / 1000);
}));

$process->set('binding', new Func(function($name) {
  $module = Module::get($name);
  if ($module === null) {
    throw new Ex(Err::create("Binding `$name` not found."));
  }
  return $module;
}));

$process->set('cwd', new Func(function() {
  return getcwd();
}));

$env = new Obj();
$env->setProps(getenv());
$process->set('env', $env);
unset($env);

//command line arguments
$process->argv = isset(GlobalObject::$OLD_GLOBALS['argv']) ? GlobalObject::$OLD_GLOBALS['argv'] : array();
//first argument is path to script
array_unshift($process->argv, 'php');
$process->set('argv', Arr::fromArray($process->argv));

$process->set('stdout', new Obj('write', new Func(function($data) {
  echo $data;
})));

$process->set('stderr', new Obj('write', new Func(function($data) {
  fwrite(STDERR, $data);
})));