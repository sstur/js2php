<?php
$Boolean = call_user_func(function() {
  $Boolean = new Func(function($this_, $arguments, $value) {
    if ($this_ instanceof Boolean) {
      $this_->value = $value ? true : false;
    } else {
      return $value ? true : false;
    }
  });
  $Boolean->instantiate = function() {
    return new Boolean();
  };
  $Boolean->set('prototype', Boolean::$protoObject);
  return $Boolean;
});