<?php
$process = new Object();
$process->set('exit', new Func(function($this_, $arguments, $code = 0) {
  exit($code);
}));
