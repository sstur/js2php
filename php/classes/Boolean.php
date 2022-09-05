<?php
class Bln extends Obj {
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
    $Boolean = new Func(function($value = false) {
      $self = Func::getContext();
      if ($self instanceof Bln) {
        $self->value = $value ? true : false;
        return $self;
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
  'valueOf' => function() {
      $self = Func::getContext();
      return $self->value;
    },
  'toString' => function() {
      $self = Func::getContext();
      return new Str(to_string($self->value));
    }
);

Bln::$protoObject = new Obj();
Bln::$protoObject->setMethods(Bln::$protoMethods, true, false, true);
