<?php
class Arr extends Object {
  public $className = "[object Array]";
  public $length = 0;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    $args = func_get_args();
    if (count($args) > 0) {
      $this->init($args);
    } else {
      $this->length = 0;
    }
  }

  function init($arr) {
    foreach ($arr as $i => $item) {
      $this->set($i, $item);
    }
    $this->length = count($arr);
  }

  function push($value) {
    $i = $this->length;
    $this->set($i, $value);
    //we don't need to return a float here because this is an internal method
    return ($this->length = $i + 1);
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

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Array = new Func(function($this_, $arguments, $value = null) {
      $arr = new Arr();
      $len = $arguments->length;
      if ($len === 1 && is_int_or_float($value)) {
        $arr->length = (int)$value;
      } else if ($len > 0) {
        $arr->init($arguments->args);
      }
      return $arr;
    });
    $Array->set('prototype', Arr::$protoObject);
    $Array->setMethods(Arr::$classMethods, true, false, true);
    return $Array;
  }
}

Arr::$classMethods = array(
  'isArray' => function($this_, $arguments, $arr) {
      return ($arr instanceof Arr);
    }
);

Arr::$protoMethods = array(
  //todo: concat, splice, lastIndexOf
  'push' => function($this_, $arguments, $value) {
      //this is a special case, we have a low-level method
      return (float)$this_->push($value);
    },
  'pop' => function($this_) {
      $i = $this_->length - 1;
      $result = $this_->get($i);
      $this_->remove($i);
      $this_->length = $i;
      return $result;
    },
  'join' => function($this_, $arguments, $str = ',') {
      $results = array();
      $len = $this_->length;
      for ($i = 0; $i < $len; $i++) {
        $value = $this_->get($i);
        $results[] = ($value === null || $value === Null::$null) ? '' : to_string($value);
      }
      return join(to_string($str), $results);
    },
  'indexOf' => function($this_, $arguments, $value) {
      $len = $this_->length;
      for ($i = 0; $i < $len; $i++) {
        if ($this_->get($i) === $value) return (float)$i;
      }
      return -1.0;
    },
  'slice' => function($this_, $arguments, $start = 0, $end = null) {
      $len = $this_->length;
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
        $value = $this_->get($i);
        $result->set($i, $value);
      }
      return $result;
    },
  'forEach' => function($this_, $arguments, $fn, $context = null) {
      $len = $this_->length;
      for ($i = 0; $i < $len; $i++) {
        if ($this_->hasOwnProperty($i)) {
          $fn->call($context, $this_->get($i), (float)$i, $this_);
        }
      }
    },
  'sort' => function($this_, $arguments, $fn = null) {
      if ($fn instanceof Func) {
        $results = $this_->toArray();
        $comparator = function($a, $b) use (&$fn) {
          return $fn->call(null, $a, $b);
        };
        uasort($results, $comparator);
      } else {
        $results = array();
        $len = $this_->length;
        for ($i = 0; $i < $len; $i++) {
          $results[$i] = to_string($this_->get($i));
        }
        asort($results, SORT_STRING);
      }
      $i = 0;
      $temp = new StdClass();
      foreach ($results as $index => $str) {
        $temp->{$i} = $this_->data->{$index};
        $i += 1;
      }
      foreach ($temp as $i => $prop) {
        $this_->data->{$i} = $prop;
      }
      return $this_;
    },
  'toString' => function($this_) {
      return $this_->callMethod('join');
    }
);

Arr::$protoObject = new Object();
Arr::$protoObject->setMethods(Arr::$protoMethods, true, false, true);
