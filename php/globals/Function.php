<?php
$Function = call_user_func(function() {
  $Function = new Func(function($this_, $arguments, $fn) {
    throw new Exception('Cannot construct function at runtime.');
  });
  $Function->instantiate = function() {
    throw new Exception('Cannot construct function at runtime.');
  };
  $Function->set('prototype', Func::$protoObject);
  return $Function;
});