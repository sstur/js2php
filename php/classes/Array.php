<?php
class Arr extends Object {
  public $className = "Array";
  public $length = 0;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;
  //used to represent a "hole" in an array
  static $empty = null;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    //set a non-enumerable, non-configurable property descriptor for length
    $this->setProp('length', null, true, false, false);
    if (func_num_args() > 0) {
      $this->init(func_get_args());
    } else {
      $this->length = 0;
    }
  }

  function init($arr) {
    $len = 0;
    foreach ($arr as $i => $item) {
      if ($item !== Arr::$empty) {
        $this->set($i, $item);
      }
      $len += 1;
    }
    $this->length = $len;
  }

  function push($value) {
    $i = $this->length;
    foreach (func_get_args() as $value) {
      $this->set($i, $value);
      $i += 1;
    }
    //we don't need to return a float here because this is an internal method
    return ($this->length = $i);
  }

  function shift() {
    $el = $this->get(0);
    //shift all elements
    $len = $this->length;
    //todo: descriptors
    for ($pos = 1; $pos < $len; $pos ++) {
      $newPos = $pos - 1;
      if (array_key_exists($pos, $this->data)) {
        $this->data[$newPos] = $this->data[$pos];
      } else if (array_key_exists($newPos, $this->data)) {
        unset($this->data[$newPos]);
      }
    }
    //remove what was previously the last element
    unset($this->data[$len - 1]);
    $this->length = $len - 1;
    return $el;
  }

  function unshift($value) {
    $len = $this->length;
    $num = func_num_args();
    //shift all elements
    $pos = $len;
    while ($pos--) {
      $newPos = $pos + $num;
      if (array_key_exists($pos, $this->data)) {
        $this->data[$newPos] = $this->data[$pos];
        unset($this->data[$pos]);
      } else if (array_key_exists($newPos, $this->data)) {
        unset($this->data[$newPos]);
      }
    }
    $this->length = $len + $num;
    //add new element(s)
    foreach (func_get_args() as $i => $value) {
      $this->set($i, $value);
    }
    //we don't need to return a float here because this is an internal method
    return $this->length;
  }

  static function checkInt($s) {
    if (is_int($s) && $s >= 0) return (float)$s;
    $s = to_string($s);
    $match = preg_match('/^\d+$/', $s);
    return ($match !== false) ? (float)$s : null;
  }

  function set($key, $value) {
    $i = self::checkInt($key);
    if ($i !== null && $i >= $this->length) {
      $this->length = $i + 1;
    }
    return parent::set($key, $value);
  }

  function get_length() {
    return (float)$this->length;
  }

  function set_length($len) {
    $len = self::checkInt($len);
    if ($len === null) {
      throw new Ex(Error::create('Invalid array length'));
    }
    //when setting the length smaller than before, we need to delete elements
    $oldLen = $this->length;
    if ($oldLen > $len) {
      for ($i = $len; $i < $oldLen; $i++) {
        $this->remove($i);
      }
    }
    $this->length = $len;
    return (float)$len;
  }

  function toArray() {
    $results = array();
    $len = $this->length;
    for ($i = 0; $i < $len; $i++) {
      $results[] = $this->get($i);
    }
    return $results;
  }

  static function fromArray($nativeArray) {
    $arr = new Arr();
    $arr->init($nativeArray);
    return $arr;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Array = new Func(function($value = null) {
      $arr = new Arr();
      $len = func_num_args();
      if ($len === 1 && is_int_or_float($value)) {
        $arr->length = (int)$value;
      } else if ($len > 0) {
        $arr->init(func_get_args());
      }
      return $arr;
    });
    $Array->set('prototype', Arr::$protoObject);
    $Array->setMethods(Arr::$classMethods, true, false, true);
    return $Array;
  }
}

Arr::$classMethods = array(
  'isArray' => function($arr) {
      return ($arr instanceof Arr);
    }
);

// splice, reverse, some, every, reduce, reduceRight
Arr::$protoMethods = array(
  'push' => function($value) {
      $self = Func::getContext();
      //for this we have a low-level method
      $length = call_user_func_array(array($self, 'push'), func_get_args());
      return (float)$length;
    },
  'pop' => function() {
      $self = Func::getContext();
      $i = $self->length - 1;
      $result = $self->get($i);
      $self->remove($i);
      $self->length = $i;
      return $result;
    },
  'unshift' => function($value) {
      $self = Func::getContext();
      //for this we have a low-level method
      $length = call_user_func_array(array($self, 'unshift'), func_get_args());
      return (float)$length;
    },
  'shift' => function() {
      $self = Func::getContext();
      //for this we have a low-level method
      return $self->shift();
    },
  'join' => function($str = ',') {
      $results = array();
      $self = Func::getContext();
      $len = $self->length;
      for ($i = 0; $i < $len; $i++) {
        $value = $self->get($i);
        $results[] = ($value === null || $value === Object::$null) ? '' : to_string($value);
      }
      return join(to_string($str), $results);
    },
  'indexOf' => function($value) {
      $self = Func::getContext();
      $len = $self->length;
      for ($i = 0; $i < $len; $i++) {
        if ($self->get($i) === $value) return (float)$i;
      }
      return -1.0;
    },
  'lastIndexOf' => function($value) {
      $self = Func::getContext();
      $i = $self->length;
      while ($i--) {
        if ($self->get($i) === $value) return (float)$i;
      }
      return -1.0;
    },
  'slice' => function($start = 0, $end = null) {
      $self = Func::getContext();
      $len = $self->length;
      if ($len === 0) {
        return new Arr();
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return new Arr();
      }
      $end = ($end === null) ? $len : (int)$end;
      if ($end < 0) {
        $end = $len + $end;
      }
      if ($end < $start) {
        $end = $start;
      }
      if ($end > $len) {
        $end = $len;
      }
      $result = new Arr();
      for ($i = $start; $i < $end; $i++) {
        $value = $self->get($i);
        $result->push($value);
      }
      return $result;
    },
  'forEach' => function($fn, $context = null) {
      $self = Func::getContext();
      $len = $self->length;
      for ($i = 0; $i < $len; $i++) {
        if ($self->hasOwnProperty($i)) {
          $fn->call($context, $self->get($i), (float)$i, $self);
        }
      }
    },
  'map' => function($fn, $context = null) {
      $self = Func::getContext();
      $results = new Arr();
      $len = $results->length = $self->length;
      for ($i = 0; $i < $len; $i++) {
        if ($self->hasOwnProperty($i)) {
          $result = $fn->call($context, $self->get($i), (float)$i, $self);
          $results->set($i, $result);
        }
      }
      return $results;
    },
  'filter' => function($fn, $context = null) {
      $self = Func::getContext();
      $results = new Arr();
      $len = $self->length;
      for ($i = 0; $i < $len; $i++) {
        if ($self->hasOwnProperty($i)) {
          $item = $self->get($i);
          $result = $fn->call($context, $item, (float)$i, $self);
          if (is($result)) {
            $results->push($item);
          }
        }
      }
      return $results;
    },
  'sort' => function($fn = null) {
      $self = Func::getContext();
      if ($fn instanceof Func) {
        $results = $self->toArray();
        $comparator = function($a, $b) use (&$fn) {
          return $fn->call(null, $a, $b);
        };
        uasort($results, $comparator);
      } else {
        $results = array();
        $len = $self->length;
        for ($i = 0; $i < $len; $i++) {
          $results[$i] = to_string($self->get($i));
        }
        asort($results, SORT_STRING);
      }
      //todo: descriptors
      $i = 0;
      $temp = array();
      foreach ($results as $index => $str) {
        $temp[$i] = $self->data[$index];
        $i += 1;
      }
      foreach ($temp as $i => $prop) {
        $self->data[$i] = $prop;
      }
      return $self;
    },
  'concat' => function() {
      $self = Func::getContext();
      $items = $self->toArray();
      foreach (func_get_args() as $item) {
        if ($item instanceof Arr) {
          foreach ($item->toArray() as $subitem) {
            $items[] = $subitem;
          }
        } else {
          $items[] = $item;
        }
      }
      $arr = new Arr();
      $arr->init($items);
      return $arr;
    },
  'splice' => function() {
      throw new Ex(Error::create('array.splice not implemented'));
    },
  'reverse' => function() {
      throw new Ex(Error::create('array.reverse not implemented'));
    },
  'some' => function() {
      throw new Ex(Error::create('array.some not implemented'));
    },
  'every' => function() {
      throw new Ex(Error::create('array.every not implemented'));
    },
  'reduce' => function() {
      throw new Ex(Error::create('array.reduce not implemented'));
    },
  'reduceRight' => function() {
      throw new Ex(Error::create('array.reduceRight not implemented'));
    },
  'toString' => function() {
      $self = Func::getContext();
      return $self->callMethod('join');
    },
  'toLocaleString' => function() {
      $self = Func::getContext();
      return $self->callMethod('join');
    }
);

Arr::$protoObject = new Object();
Arr::$protoObject->setMethods(Arr::$protoMethods, true, false, true);
Arr::$empty = new StdClass();
