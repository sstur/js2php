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
      $this->length = mb_strlen($str);
    }
  }

  function get_length() {
    return (float)$this->length;
  }

  function set_length($len) {
    return $len;
  }

  static function initProtoObject() {
    $methods = array(
      'charAt' => function($this_, $arguments, $i) {
          $ch = mb_substr($this_->value, $i, 1);
          return ($ch === false) ? '' : $ch;
        },
      'charCodeAt' => function($this_, $arguments, $i) {
          $ch = mb_substr($this_->value, $i, 1);
          if ($ch === false) return NaN::$nan;
          $len = strlen($ch);
          if ($len === 1) {
            $code = ord($ch[0]);
          } else {
            $ch = mb_convert_encoding($ch, 'UCS-2LE', 'UTF-8');
            $code = ord($ch[1]) * 256 + ord($ch[0]);
          }
          return (float)$code;
        },
      'slice' => function($this_, $arguments, $start, $end = null) {
          $len = $this_->length;
          if ($len === 0) {
            return '';
          }
          $start = (int)$start;
          if ($start < 0) {
            $start = $len + $start;
            if ($start < 0) $start = 0;
          }
          if ($start >= $len) {
            return '';
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
          return mb_substr($this_->value, $start, $end - $start);
        },
      'valueOf' => function($this_) {
          return $this_->value;
        },
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
