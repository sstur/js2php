<?php
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
$Boolean->setMethods(Bln::$classMethods, true, false, true);
