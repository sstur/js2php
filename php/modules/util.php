<?php
Module::define('util', function() {
  $methods = array(
    'inspect' => function($value, $opts = null) {
        return strval($value);
      },
    'isString' => function($value) {
      return is_string($value);
    }
  );

  $util = new ObjectClass();
  $util->setMethods($methods, true, false, true);
  return $util;
});
