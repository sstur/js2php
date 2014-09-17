<?php
class Str extends Object {
  public $className = "[object String]";
  public $value = null;

  static $protoObject = null;
  static $classMethods = null;

  function __construct($str = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->value = $str;
    }
  }

  static function initProtoObject() {
    $methods = array(
      'charAt' => function($this_, $arguments, $i) {
          $ch = mb_substr($this_->value, 0, 1, 'utf-8');
          return ($ch === false) ? '' : $ch;
        },
      'charCodeAt' => function($this_, $arguments, $i) {
          $ch = mb_substr($this_->value, 0, 1, 'utf-8');
          return ($ch === false) ? NaN::$nan : ord($ch);
        },
      'valueOf' => function($this_) {
          return $this_->value;
        },
      //todo: substr, trim
      'toString' => function($this_) {
          return $this_->value;
        }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods, true, false, true);
  }
}

Str::$classMethods = array(
  'fromCharCode' => function($this_, $arguments, $code) {
      return chr($code);
    }
);

Str::initProtoObject();
