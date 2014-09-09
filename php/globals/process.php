<?php
$process = new Object();
$process->set('exit', new Func(function($this_, $arguments, $code = 0) {
  $code = intval($code);
  exit($code);
}));
