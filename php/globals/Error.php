<?php
$Error = call_user_func(function() {
  $Error = new Func(function($this_, $arguments, $str) {
    if (!($this_ instanceof Error)) {
      $this_ = $this->instantiate();
    }
    $this_->set('message', to_string($str));
    return $this_;
  });
  $Error->instantiate = function() {
    return new Error();
  };
  $Error->set('prototype', Error::$protoObject);
  return $Error;
});