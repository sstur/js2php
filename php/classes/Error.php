<?php
class Error extends Object {
  public $className = "[object Error]";

  static $protoObject = null;
  static $classMethods = null;

  function __construct($str = null) {
    parent::__construct();
    $this->setProto(self::$protoObject);
    if (func_num_args() === 1) {
      $this->set('message', to_string($str));
    }
  }

  //this is used in class/helper code only
  static function create($str) {
    return new Error($str);
  }

  static function initProtoObject() {
    $methods = array(
      'toString' => function($this_) {
          return $this_->get('message');
        }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods, true, false, true);
  }
}

Error::$classMethods = array();

Error::initProtoObject();
