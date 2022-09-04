<?php
class Err extends Obj {
  public $className = "Error";
  public $stack = null;

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

  public function getMessage() {
    $message = $this->get('message');
    return $this->className . ($message ? ': ' . $message : '');
  }

  //this is used in class/helper code only
  static function create($str, $framesToPop = 0) {
    $error = new Err($str);
    $stack = debug_backtrace();
    while ($framesToPop--) {
      array_shift($stack);
    }
    $error->stack = $stack;
    return $error;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Error = new Func(function($str = null) {
      $error = new Err($str);
      $error->stack = debug_backtrace();
      return $error;
    });
    $Error->set('prototype', Err::$protoObject);
    $Error->setMethods(Err::$classMethods, true, false, true);
    return $Error;
  }
}

class RangeErr extends Err {
  public $className = "RangeError";
}

class ReferenceErr extends Err {
  public $className = "ReferenceError";
}

class SyntaxErr extends Err {
  public $className = "SyntaxError";
}

class TypeErr extends Err {
  public $className = "TypeError";
}

Err::$classMethods = array();

Err::$protoMethods = array(
  'toString' => function() {
      $self = Func::getContext();
      return $self->get('message');
    }
);

Err::$protoObject = new Obj();
Err::$protoObject->setMethods(Err::$protoMethods, true, false, true);
