<?php
class Bln extends Object {
  public $className = "[object Boolean]";
  public $value = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct($value = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->value = $value;
    }
  }

  static function initProtoObject() {
    self::$protoObject = new Object();
    self::$protoObject->setMethods(Bln::$protoMethods, true, false, true);
  }
}

Bln::$classMethods = array();

Bln::$protoMethods = array(
  'valueOf' => function($this_) {
      return $this_->value;
    },
  'toString' => function($this_) {
      return to_string($this_->value);
    }
);

Bln::initProtoObject();
