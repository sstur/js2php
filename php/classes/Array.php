<?php
class Arr extends Object implements JsonSerializable {
  public $className = "[object Array]";

  static $protoObject = null;

  function __construct() {
    parent::__construct();
    $this->setProto(self::$protoObject);
    $args = func_get_args();
    if (count($args) > 0) {
      $this->_init($args);
    } else {
      $this->data->length = new Property(0.0, true, false, false);
    }
  }

  function _init($arr) {
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
    $methods = array(
      'push' => function($this_, $arguments, $value) {
        //this is a special case, we have a low-level method
        $this_->push($value);
        return $this_->get('length');
      },
      'pop' => function($this_) {
        $i = $this_->data->length->value - 1;
        $result = $this_->get($i);
        unset($this_->data->{$i});
        $this_->data->length->value = $i;
        return $result;
      },
      'join' => function($this_, $arguments, $str = ',') {
        $results = array();
        $len = $this_->data->length->value;
        for ($i = 0; $i < $len; $i++) {
          $results[] = to_string($this_->get($i));
        }
        return join($str, $results);
      },
      //todo: splice, indexOf, lastIndexOf
      'toString' => function($this_) {
        return $this_->callMethod('join');
      }
    );
    self::$protoObject = new Object();
    self::$protoObject->setMethods($methods);
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
      throw new Exception('RangeError: Invalid array length');
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

  function jsonSerialize() {
    $results = array();
    $len = $this->data->length->value;
    for ($i = 0; $i < $len; $i++) {
      $results[] = $this->get($i);
    }
    return $results;
  }
}

Arr::initProtoObject();
