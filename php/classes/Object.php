<?php
class Object implements JsonSerializable {
  public $data = null;
  public $proto = null;
  public $type = "object";
  public $className = "[object Object]";

  static $protoObject = null;
  static $global = null;

  function __construct() {
    $this->data = new StdClass();
    $this->setProto(self::$protoObject);
    $args = func_get_args();
    if (count($args) > 0) {
      $this->_init($args);
    }
  }

  function _init($arr) {
    $len = count($arr);
    for ($i = 0; $i < $len; $i += 2) {
      $this->set($arr[$i], $arr[$i + 1]);
    }
  }

  function get($key) {
    if (method_exists($this, 'get_' . $key)) {
      return $this->{'get_' . $key}();
    }
    $obj = $this;
    while ($obj !== null) {
      $data = $obj->data;
      if (property_exists($data, $key)) {
        return $data->{$key}->value;
      }
      $obj = $obj->proto;
    }
    return null;
  }

  function set($key, $value) {
    if (method_exists($this, 'set_' . $key)) {
      return $this->{'set_' . $key}($value);
    }
    $data = $this->data;
    if (property_exists($data, $key)) {
      $data->{$key}->value = $value;
    } else {
      $data->{$key} = new Property($value);
    }
    return $value;
  }

  /**
   * @param string $key
   * @param mixed $value
   * @param bool $writable
   * @param bool $enumerable
   * @param bool $configurable
   * @return mixed
   */
  function setProperty($key, $value, $writable, $enumerable, $configurable) {
    $data = $this->data;
    if (property_exists($data, $key)) {
      $prop = $data->{$key};
      $prop->value = $value;
      if ($writable !== null) $prop->writable = $writable;
      if ($enumerable !== null) $prop->enumerable = $enumerable;
      if ($configurable !== null) $prop->configurable = $configurable;
    } else {
      $data->{$key} = new Property($value, $writable, $enumerable, $configurable);
    }
    return $value;
  }

  /**
   * @return Object
   */
  function getProto() {
    return $this->proto;
  }

  /**
   * @param Object $obj
   * @return Object
   */
  function setProto($obj) {
    return $this->proto = $obj;
  }

  /**
   * @param array $props
   */
  function setProps($props) {
    foreach ($props as $key => $value) {
      $this->set($key, $value);
    }
  }

  /**
   * @param array $methods
   */
  function setMethods($methods) {
    foreach ($methods as $key => $fn) {
      $this->set($key, new Func($fn));
    }
  }

  /**
   * @param string $name
   * @return mixed
   */
  function callMethod($name) {
    /** @var Func $fn */
    $fn = $this->get($name);
    $args = array_slice(func_get_args(), 1);
    return $fn->apply($this, $args);
  }

  /**
   * @return StdClass
   */
  function jsonSerialize() {
    $results = new StdClass();
    foreach ($this->data as $key => $prop) {
      if ($prop->enumerable) {
        $results->{$key} = $prop->value;
      }
    }
    return $results;
  }

  static function initProtoObject() {
    $protoProps = array(
      'hasOwnProperty' => function($this_, $arguments, $key) {
          return property_exists($this_->data, $key);
        },
      'toString' => function($this_) {
          return $this_->className;
        },
      'valueOf' => function($this_) {
          return $this_;
        }
    );
    self::$protoObject = new Object();
    self::$protoObject->setProps($protoProps);
  }

  static function initProtoMethods() {
    $data = self::$protoObject->data;
    foreach ($data as $key => $prop) {
      if ($prop->value instanceof Closure) {
        $prop->value = new Func($prop->value);
      }
    }
  }
}

class Property {
  public $value = null;
  public $writable = true;
  public $enumerable = true;
  public $configurable = true;

  function __construct($value, $writable = true, $enumerable = true, $configurable = true) {
    $this->value = $value;
    $this->writable = $writable;
    $this->enumerable = $enumerable;
    $this->configurable = $configurable;
  }

  /**
   * @return Object
   */
  function getDescriptor() {
    $result = new Object();
    $result->set('value', $this->value);
    $result->set('writable', $this->writable);
    $result->set('enumerable', $this->enumerable);
    $result->set('configurable', $this->configurable);
    return $result;
  }
}

Object::initProtoObject();
