<?php
class Object {
  public $data = null;
  public $proto = null;
  public $className = "Object";

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;
  static $null = null;

  /**
   * holds the "global" object (on which all global variables exist as properties)
   * @var GlobalObject
   */
  static $global = null;

  function __construct() {
    $this->data = new ArrayObject(array(), ArrayObject::ARRAY_AS_PROPS);
    $this->proto = self::$protoObject;
    $args = func_get_args();
    if (count($args) > 0) {
      $this->init($args);
    }
  }

  /**
   * Sets properties from an array (arguments) similar to:
   * `array('key1', $value1, 'key2', $value2)`
   * @param array $arr
   */
  function init($arr) {
    $len = count($arr);
    for ($i = 0; $i < $len; $i += 2) {
      $this->set($arr[$i], $arr[$i + 1]);
    }
  }

  function get($key) {
    $key = (string)$key;
    if (method_exists($this, 'get_' . $key)) {
      return $this->{'get_' . $key}();
    }
    $obj = $this;
    while ($obj !== Object::$null) {
      $data = $obj->data;
      if (array_key_exists($key, $data)) {
        return $data->{$key}->value;
      }
      $obj = $obj->proto;
    }
    return null;
  }

  function set($key, $value) {
    $key = (string)$key;
    if (method_exists($this, 'set_' . $key)) {
      return $this->{'set_' . $key}($value);
    }
    $data = $this->data;
    if (array_key_exists($key, $data)) {
      $property = $data->{$key};
      if ($property->writable) {
        $property->value = $value;
      }
    } else {
      $data->{$key} = new Property($value);
    }
    return $value;
  }

  function remove($key) {
    $key = (string)$key;
    $data = $this->data;
    if (array_key_exists($key, $data)) {
      if (!$data->{$key}->configurable) {
        return false;
      }
      unset($data->{$key});
    }
    return true;
  }

  //determine if the given property exists (don't walk proto)
  function hasOwnProperty($key) {
    $key = (string)$key;
    return array_key_exists($key, $this->data);
  }

  //determine if the given property exists (walk proto)
  function hasProperty($key) {
    $key = (string)$key;
    if (array_key_exists($key, $this->data)) {
      return true;
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      return $proto->hasProperty($key);
    }
    return false;
  }

  //produce the list of keys (optionally get only enumerable keys)
  function getOwnKeys($onlyEnumerable) {
    $arr = array();
    foreach ($this->data as $key => $prop) {
      if ($onlyEnumerable) {
        if ($prop->enumerable) {
          $arr[] = $key;
        }
      } else {
        $arr[] = $key;
      }
    }
    return $arr;
  }

  //produce the list of keys that are considered to be enumerable (walk proto)
  function getKeys(&$arr = array()) {
    foreach ($this->data as $key => $prop) {
      if ($prop->enumerable) {
        $arr[] = $key;
      }
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      $proto->getKeys($arr);
    }
    return $arr;
  }

  /**
   * @param string $key
   * @param mixed $value
   * @param bool $writable
   * @param bool $enumerable
   * @param bool $configurable
   * @return mixed
   */
  function setProperty($key, $value, $writable = null, $enumerable = null, $configurable = null) {
    $key = (string)$key;
    $data = $this->data;
    if (array_key_exists($key, $data)) {
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
   * @param array $props
   * @param bool|null $writable
   * @param bool|null $enumerable
   * @param bool|null $configurable
   */
  function setProps($props, $writable = null, $enumerable = null, $configurable = null) {
    foreach ($props as $key => $value) {
      $this->setProperty($key, $value, $writable = null, $enumerable = null, $configurable = null);
    }
  }

  /**
   * @param array $methods
   * @param bool|null $writable
   * @param bool|null $enumerable
   * @param bool|null $configurable
   */
  function setMethods($methods, $writable = null, $enumerable = null, $configurable = null) {
    foreach ($methods as $name => $fn) {
      $func = new Func($name, $fn);
      $func->strict = true;
      $this->setProperty($name, $func, $writable, $enumerable, $configurable);
    }
  }

  /**
   * Get a native associative array containing enumerable own properties
   * @return array
   */
  function toArray() {
    $keys = $this->getOwnKeys(true);
    $results = array();
    foreach ($keys as $key) {
      $results[$key] = $this->get($key);
    }
    return $results;
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
   * Similar to callMethod, we can call "internal" methods (dynamically-attached
   * user functions) which are available in PHP land but not from JS
   *
   * @param string $name - method name
   * @param array $args - arguments with which method was called
   * @return mixed
   * @throws Ex
   */
  function __call($name, $args) {
    if (isset($this->$name)) {
      return call_user_func_array($this->$name, $args);
    } else {
      throw new Ex(Error::create('Internal method `' . $name . '` not found on ' . gettype($this)));
    }
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Object = new Func(function($this_, $arguments, $value = null) {
      if ($arguments->length === 0) {
        return new Object();
      } else if ($value === null || $value === Object::$null) {
        return new Object();
      } else {
        return objectify($value);
      }
    });
    $Object->set('prototype', Object::$protoObject);
    $Object->setMethods(Object::$classMethods, true, false, true);
    return $Object;
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

Object::$classMethods = array(
  //todo: getPrototypeOf, seal, freeze, preventExtensions, isSealed, isFrozen, isExtensible
  'create' => function($this_, $arguments, $proto) {
      if (!($proto instanceof Object) && $proto !== Object::$null) {
        throw new Ex(Error::create('Object prototype may only be an Object or null'));
      }
      $obj = new Object();
      $obj->proto = $proto;
      return $obj;
    },
  'keys' => function($this_, $arguments, $obj) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.keys called on non-object'));
      }
      $results = new Arr();
      $results->init($obj->getOwnKeys(true));
      return $results;
    },
  'getOwnPropertyNames' => function($this_, $arguments, $obj) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.getOwnPropertyNames called on non-object'));
      }
      $results = new Arr();
      $results->init($obj->getOwnKeys(false));
      return $results;
    },
  'getOwnPropertyDescriptor' => function($this_, $arguments, $obj, $key) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.getOwnPropertyDescriptor called on non-object'));
      }
      $result = $obj->get($key);
      return ($result) ? $result->getDescriptor() : null;
    },
  'defineProperty' => function($this_, $arguments, $obj, $key, $desc) {
      //todo: ensure configurable
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.defineProperty called on non-object'));
      }
      $value = $desc->get('value');
      $writable = $desc->get('writable');
      if ($writable === null) $writable = true;
      $enumerable = $desc->get('enumerable');
      if ($enumerable === null) $enumerable = true;
      $configurable = $desc->get('configurable');
      if ($configurable === null) $configurable = true;
      $obj->data->{$key} = new Property($value, $writable, $enumerable, $configurable);
    },
  'defineProperties' => function($this_, $arguments, $obj, $items) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.defineProperties called on non-object'));
      }
      $methods = Object::$classMethods;
      foreach ($items->data as $key => $prop) {
        if ($prop->enumerable) {
          $methods['defineProperty'](null, null, $obj, $key, $prop->value);
        }
      }
    }
);

Object::$protoMethods = array(
  'hasOwnProperty' => function($this_, $arguments, $key) {
      $key = (string)$key;
      return array_key_exists($key, $this_->data);
    },
  'toString' => function($this_) {
      if ($this_ === null) {
        $className = 'Undefined';
      } else if ($this_ === Object::$null) {
        $className = 'Null';
      } else {
        $obj = objectify($this_);
        $className = $obj->className;
      }
      return '[object ' . $className . ']';
    },
  'valueOf' => function($this_) {
      return $this_;
    }
);

class Null {}

Object::$null = new Null();
//the methods are not set on Object.prototype until *after* Func class is defined
Object::$protoObject = new Object();
Object::$protoObject->proto = Object::$null;
