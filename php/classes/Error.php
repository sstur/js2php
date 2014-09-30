<?php
class Error extends Object {
  public $className = "[object Error]";
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
    //todo: TypeError, SyntaxError, etc
    return $message ? 'Error: ' . $message : 'Error';
  }

  //this is used in class/helper code only
  static function create($str) {
    $error = new self($str);
    $error->stack = debug_backtrace();
    return $error;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Error = new Func(function($this_, $arguments, $str = null) {
      $error = new self($str);
      $error->stack = debug_backtrace();
      return $error;
    });
    $Error->set('prototype', self::$protoObject);
    $Error->setMethods(self::$classMethods, true, false, true);
    return $Error;
  }
}

class RangeError extends Error {
  public $className = "[object RangeError]";
}

class ReferenceError extends Error {
  public $className = "[object ReferenceError]";
}

class SyntaxError extends Error {
  public $className = "[object SyntaxError]";
}

class TypeError extends Error {
  public $className = "[object TypeError]";
}

Error::$classMethods = array();

Error::$protoMethods = array(
  'toString' => function($this_) {
      return $this_->get('message');
    }
);

Error::$protoObject = new Object();
Error::$protoObject->setMethods(Error::$protoMethods, true, false, true);
