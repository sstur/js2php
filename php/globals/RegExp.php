<?php
$RegExp = new Func(function($this_, $arguments) {
  $reg = new RegExp();
  $reg->init($arguments->args);
  return $reg;
});
$RegExp->instantiate = function() {
  return new RegExp();
};
$RegExp->set('prototype', RegExp::$protoObject);
$RegExp->setMethods(RegExp::$classMethods, true, false, true);
