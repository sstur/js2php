<?php
class String extends Object {
  public $className = "[object String]";
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
      'charAt' => function($this_, $arguments, $i) {
        return $this_->value[$i];
      },
      'charCodeAt' => function($this_, $arguments, $i) {
        return ord($this_->value[$i]);
      },
      'valueOf' => function($this_) {
        return $this_->value;
      },
      'toString' => function($this_) {
        return $this_->value;
      }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods);
  }
}

String::initProtoObject();
