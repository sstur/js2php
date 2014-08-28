<?php
$String = call_user_func(function() {
  $String = new Func(function($this_, $arguments, $value) {
    if ($this_ instanceof Str) {
      $this_->value = to_string($value);
    } else {
      return to_string($value);
    }
  });
  $String->instantiate = function() {
    return new Str();
  };
  $String->set('prototype', RegExp::$protoObject);
  //define "static" methods
  $methods = array(
    'fromCharCode' => function($this_, $arguments, $code) {
      return chr($code);
    }
  );
  $String->setMethods($methods);
  return $String;
});