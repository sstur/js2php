<?php
$Number = new Func(function($this_, $arguments, $value) {
  if ($this_ instanceof Number) {
    $this_->value = to_number($value);
  } else {
    return to_number($value);
  }
});
$Number->instantiate = function() {
  return new Number();
};
$Number->set('prototype', Number::$protoObject);
$Number->setMethods(Number::$classMethods, true, false, true);
