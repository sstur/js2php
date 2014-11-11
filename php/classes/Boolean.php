<?php
class Bln extends Object {
  public $className = "Boolean";
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

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Boolean = new Func(function($this_, $arguments, $value = false) {
      if ($this_ instanceof Bln) {
        $this_->value = $value ? true : false;
        return $this_;
      } else {
        return $value ? true : false;
      }
    });
    $Boolean->instantiate = function() {
      return new Bln();
    };
    $Boolean->set('prototype', Bln::$protoObject);
    $Boolean->setMethods(Bln::$classMethods, true, false, true);
    return $Boolean;
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

Bln::$protoObject = new Object();
Bln::$protoObject->setMethods(Bln::$protoMethods, true, false, true);
