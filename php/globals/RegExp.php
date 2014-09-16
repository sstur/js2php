<?php
$RegExp = call_user_func(function() {
  $RegExp = new Func(function($this_, $arguments) {
    $reg = new RegExp();
    $reg->init($arguments->args);
    return $reg;
  });
  $RegExp->set('prototype', RegExp::$protoObject);
  return $RegExp;
});