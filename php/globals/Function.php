<?php
$Function = call_user_func(function() {
  $Function = new Func(function($this_, $arguments, $fn) {
    throw new Ex(Error::create('Cannot construct function at runtime.'));
  });
  $Function->instantiate = function() {
    throw new Ex(Error::create('Cannot construct function at runtime.'));
  };
  $Function->set('prototype', Func::$protoObject);
  return $Function;
});