<?php
$Date = new Func(function($this_, $arguments) {
  $date = new Date();
  $date->init($arguments->args);
  return $date;
});
$Date->set('prototype', Date::$protoObject);
$Date->setMethods(Date::$classMethods, true, false, true);
