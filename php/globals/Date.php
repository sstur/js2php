<?php
$Date = call_user_func(function() {
  $Date = new Func(function($this_, $arguments) {
    $date = new Date();
    $date->init($arguments->args);
    return $date;
  });
  $Date->set('prototype', Date::$protoObject);
  //define "static" methods
  $methods = array(
    'now' => function($this_) {
      return Date::now();
    },
    'parse' => function($this_, $arguments, $str) {
      $date = new Date($str);
      return $date->value;
    },
    'UTC' => function($this_, $arguments) {
      $date = new Date();
      $date->_initFromParts($arguments->args, 'UTC');
      return $date->value;
    }
  );
  $Date->setMethods($methods, true, false, true);
  return $Date;
});