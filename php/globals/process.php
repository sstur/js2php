<?php
$process = new Object();

// the type of interface between web server and PHP
$process->set('sapi_name', php_sapi_name());

$process->set('exit', new Func(function($this_, $arguments, $code = 0) {
  $code = intval($code);
  exit($code);
}));
