<?php
class Arr extends Object implements JsonSerializable {
  public $className = "[object Array]";

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
      $this->data->length = new Property(0.0, true, false, false);
    }
  }

  function init($arr) {
    $len = count($arr);
    for ($i = 0; $i < $len; $i++) {
      $this->data->{$i} = new Property($arr[$i]);
    }
    $this->data->length = new Property((float)$len, true, false, false);
  }

  function push($value) {
    $i = $this->data->length->value;
    $this->data->{$i} = new Property($value);
    return ($this->data->length->value = $i + 1);
  }

  static function checkInt($s) {
    if (is_int($s) && $s >= 0) return (float)$s;
    $s = to_string($s);
    $match = preg_match('/^\d+$/', $s);
    return ($match !== false) ? (float)$s : null;
  }

  static function initProtoObject() {
    self::$protoObject = new Object();
    self::$protoObject->setMethods(Arr::$protoMethods, true, false, true);
  }

  function set($key, $value) {
    $i = self::checkInt($key);
    if ($i !== null && $i >= $this->data->length->value) {
      $this->data->length->value = $i + 1;
    }
    parent::set($key, $value);
  }

  function set_length($len) {
    $len = self::checkInt($len);
    if ($len === null) {
      throw new Ex(Error::create('RangeError: Invalid array length'));
    }
    $oldLen = $this->data->length->value;
    if ($oldLen > $len) {
      for ($i = $len; $i < $oldLen; $i++) {
        unset($this->data->{$i});
      }
    }
    $this->data->length->value = $len;
    return $len;
  }

  function toArray() {
    $results = array();
    $len = $this->data->length->value;
    for ($i = 0; $i < $len; $i++) {
      $results[] = $this->get($i);
    }
    return $results;
  }

  function jsonSerialize() {
    return $this->toArray();
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
      $this_->push($value);
      return $this_->get('length');
    },
  'pop' => function($this_) {
      $i = $this_->get('length') - 1;
      $result = $this_->get($i);
      unset($this_->data->{$i});
      $this_->set('length', $i);
      return $result;
    },
  'join' => function($this_, $arguments, $str = ',') {
      $results = array();
      $len = $this_->get('length');
      for ($i = 0; $i < $len; $i++) {
        $results[] = to_string($this_->get($i));
      }
      return join($str, $results);
    },
  'indexOf' => function($this_, $arguments, $value) {
      $len = $this_->get('length');
      for ($i = 0; $i < $len; $i++) {
        if ($this_->get($i) === $value) return (float)$i;
      }
      return -1.0;
    },
  //note: we should technically skip holes; we gloss over that edge case here
  'forEach' => function($this_, $arguments, $fn, $context = null) {
      $len = $this_->get('length');
      for ($i = 0; $i < $len; $i++) {
        $fn->call($context, $this_->get($i), (float)$i, $this_);
      }
    },
  'sort' => function($this_, $arguments, $fn = null) {
      //todo: $fn
      $results = array();
      $len = $this_->get('length');
      for ($i = 0; $i < $len; $i++) {
        $results[$i] = to_string($this_->get($i));
      }
      asort($results, SORT_STRING);
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

Arr::initProtoObject();
