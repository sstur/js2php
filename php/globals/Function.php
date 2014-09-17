<?php
$Function = new Func(function($this_, $arguments, $fn) {
  throw new Ex(Error::create('Cannot construct function at runtime.'));
});
$Function->set('prototype', Func::$protoObject);
$Function->setMethods(Func::$classMethods, true, false, true);
