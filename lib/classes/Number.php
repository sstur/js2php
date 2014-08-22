<?php
class Number extends Object {
  public $className = "[object Number]";
  public $value = null;

  static $protoObject = null;

  function __construct($value = null) {
    parent::__construct();
    $this->setProto(self::$protoObject);
    if (func_num_args() === 1) {
      $this->value = (float)$value;
    }
  }

  static function initProtoObject() {
    $methods = array(
      'valueOf' => function($this_) {
        return $this_->value;
      },
      'toString' => function($this_, $arguments, $radix = null) {
        //todo: radix
        return to_string($this_->value);
      }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods);
  }
}

Number::initProtoObject();
