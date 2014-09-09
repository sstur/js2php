<?php
$Array = call_user_func(function() {
  $Array = new Func(function($this_, $arguments, $value) {
    $arr = new Arr();
    $len = $arguments->get('length');
    if ($len === 1.0 && is_int_or_float($value)) {
      $arr->set('length', (float)$value);
    } elseif ($len > 1) {
      $arr->_init($arguments->args);
    }
    return $arr;
  });
  $Array->set('prototype', Arr::$protoObject);
  //define "static" methods
  $methods = array(
    'isArray' => function($this_, $arguments, $arr) {
      return ($arr instanceof Arr);
    }
  );
  $Array->setMethods($methods, true, false, true);
  return $Array;
});