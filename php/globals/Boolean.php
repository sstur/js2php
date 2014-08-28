<?php
$Boolean = call_user_func(function() {
  $Boolean = new Func(function($this_, $arguments, $value) {
    if ($this_ instanceof Bln) {
      $this_->value = $value ? true : false;
    } else {
      return $value ? true : false;
    }
  });
  $Boolean->instantiate = function() {
    return new Bln();
  };
  $Boolean->set('prototype', Bln::$protoObject);
  return $Boolean;
});