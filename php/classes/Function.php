<?php
class Func extends Object {
  public $name = "";
  public $type = "function";
  public $className = "[object Function]";

  function __construct() {
    parent::__construct();
    $args = func_get_args();
    if (count($args) === 2) {
      $this->name = $args[0];
      $this->fn = $args[1];
    } else {
      $this->fn = $args[0];
    }
    $prototype = new Object('constructor', $this);
    $this->set('prototype', $prototype);
  }

  function construct() {
    if (property_exists($this, 'instantiate')) {
      $instantiate = $this->instantiate;
      $obj = $instantiate();
    } else {
      $obj = new Object();
      $obj->setProto($this->get('prototype'));
    }
    $result = $this->apply($obj, func_get_args());
    return is_primitive($result) ? $obj : $result;
  }

  function call($context = null) {
    if (func_num_args() === 0) {
      $context = Object::$global;
    }
    $args = array_slice(func_get_args(), 1);
    array_unshift($args, self::makeArgs($args, $this));
    array_unshift($args, $context);
    return call_user_func_array($this->fn, $args);
  }

  function apply($context, $args) {
    array_unshift($args, self::makeArgs($args, $this));
    array_unshift($args, $context);
    return call_user_func_array($this->fn, $args);
  }

  function get_name() {
    return $this->name;
  }

  function set_name($value) {
    return $value;
  }

  static function makeArgs($args, $callee) {
    $obj = new Object();
    $obj->args = $args;
    $len = count($args);
    for ($i = 0; $i < $len; $i++) {
      $obj->set($i, $args[$i]);
    }
    $obj->set('length', (float)$len);
    $obj->data->callee = new Property($callee, true, false, true);
    return $obj;
  }
}

Object::initProtoMethods();
