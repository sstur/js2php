<?php
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
$String->setMethods(Str::$classMethods, true, false, true);
