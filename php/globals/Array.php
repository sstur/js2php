<?php
$Array = new Func(function($this_, $arguments, $value = null) {
  $arr = new Arr();
  $len = $arguments->get('length');
  if ($len === 1.0 && is_int_or_float($value)) {
    $arr->set('length', (float)$value);
  } else if ($len > 1) {
    $arr->init($arguments->args);
  }
  return $arr;
});
$Array->set('prototype', Arr::$protoObject);
$Array->setMethods(Arr::$classMethods, true, false, true);
