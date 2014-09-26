<?php
class Error extends Object {
  public $className = "[object Error]";

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct($str = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->set('message', to_string($str));
    }
  }

  //this is used in class/helper code only
  static function create($str) {
    return new self($str);
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Error = new Func(function($this_, $arguments, $str = null) {
      return new self($str);
    });
    $Error->set('prototype', self::$protoObject);
    $Error->setMethods(self::$classMethods, true, false, true);
    return $Error;
  }
}

Error::$classMethods = array();

Error::$protoMethods = array(
  'toString' => function($this_) {
      return $this_->get('message');
    }
);

Error::$protoObject = new Object();
Error::$protoObject->setMethods(Error::$protoMethods, true, false, true);
