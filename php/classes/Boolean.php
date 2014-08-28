<?php
class Bln extends Object {
  public $className = "[object Boolean]";
  public $value = null;

  static $protoObject = null;

  function __construct($str = null) {
    parent::__construct();
    $this->setProto(self::$protoObject);
    if (func_num_args() === 1) {
      $this->value = $str;
    }
  }

  static function initProtoObject() {
    $methods = array(
      'valueOf' => function($this_) {
        return $this_->value;
      },
      'toString' => function($this_) {
        return to_string($this_->value);
      }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods);
  }
}

Bln::initProtoObject();
