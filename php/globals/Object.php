<?php
$Object = new Func(function($this_, $arguments, $value = null) {
  $len = $arguments->get('length');
  if ($len === 0.0) {
    return new Object();
  } else if ($value === null || $value === Null::$null) {
    return new Object();
  } else {
    return objectify($value);
  }
});
$Object->set('prototype', Object::$protoObject);
$Object->setMethods(Object::$classMethods, true, false, true);
