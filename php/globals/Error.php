<?php
$Error = new Func(function($this_, $arguments, $str = null) {
  return new Error($str);
});
$Error->set('prototype', Error::$protoObject);
$Error->setMethods(Error::$classMethods, true, false, true);
