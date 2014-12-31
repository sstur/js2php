<?php
class Error extends Object {
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
    $error = new Error($str);
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
      $error = new Error($str);
      $error->stack = debug_backtrace();
      return $error;
    });
    $Error->set('prototype', Error::$protoObject);
    $Error->setMethods(Error::$classMethods, true, false, true);
    return $Error;
  }
}

class RangeError extends Error {
  public $className = "RangeError";
}

class ReferenceError extends Error {
  public $className = "ReferenceError";
}

class SyntaxError extends Error {
  public $className = "SyntaxError";
}

class TypeError extends Error {
  public $className = "TypeError";
}

Error::$classMethods = array();

Error::$protoMethods = array(
  'toString' => function() {
      $self = Func::getContext();
      return $self->get('message');
    }
);

Error::$protoObject = new Object();
Error::$protoObject->setMethods(Error::$protoMethods, true, false, true);
