<?php
class Number extends Object {
  public $className = "[object Number]";
  public $value = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct($value = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->value = (float)$value;
    }
  }

  static function initProtoObject() {
    self::$protoObject = new Object();
    self::$protoObject->setMethods(Number::$protoMethods, true, false, true);
  }
}

Number::$classMethods = array(
  'parseInt' => function($this_, $arguments, $value, $radix = null) {
      $value = to_string($value);
      $value = preg_replace('/^[\\t\\x0B\\f \\xA0\\r\\n]+/', '', $value);
      $sign = ($value[0] === '-') ? -1 : 1;
      $value = preg_replace('/^[+-]/', '', $value);
      if ($radix === null && strtolower(substr($value, 0, 2)) === '0x') {
        $radix = 16;
      }
      if ($radix === null) {
        $radix = 10;
      } else {
        $radix = to_number($radix);
        if ($radix === NaN::$nan || $radix < 2 || $radix > 36) {
          return NaN::$nan;
        }
      }
      if ($radix === 10) {
        return preg_match('/^[0-9]/', $value) ? (float)(intval($value) * $sign) : NaN::$nan;
      } elseif ($radix === 16) {
        $value = preg_replace('/^0x/i', '', $value);
        return preg_match('/^[0-9a-f]/i', $value) ? (float)(hexdec($value) * $sign) : NaN::$nan;
      } elseif ($radix === 8) {
        return preg_match('/^[0-7]/', $value) ? (float)(octdec($value) * $sign) : NaN::$nan;
      }
      $value = strtoupper($value);
      $len = strlen($value);
      $numValidChars = 0;
      for ($i = 0; $i < $len; $i++) {
        $n = ord($value[$i]);
        if ($n >= 48 && $n <= 57) {
          $n = $n - 48;
        } elseif ($n >= 65 && $n <= 90) {
          $n = $n - 55;
        } else {
          $n = 36;
        }
        if ($n < $radix) {
          $numValidChars += 1;
        } else {
          break;
        }
      }
      if ($numValidChars > 0) {
        $value = substr($value, 0, $numValidChars);
        return floatval(base_convert($value, $radix, 10));
      }
      return NaN::$nan;
    },
  'parseFloat' => function($this_, $arguments, $value) {
      $value = to_string($value);
      $value = preg_replace('/^[\\t\\x0B\\f \\xA0\\r\\n]+/', '', $value);
      $sign = ($value[0] === '-') ? -1 : 1;
      $value = preg_replace('/^[+-]/', '', $value);
      if (preg_match('/^(\d+\.\d*|\.\d+|\d+)e([+-]?[0-9]+)/i', $value, $m)) {
        return (float)($sign * $m[1] * pow(10, $m[2]));
      }
      if (preg_match('/^(\d+\.\d*|\.\d+|\d+)/i', $value, $m)) {
        return (float)($m[0] * $sign);
      }
      return NaN::$nan;
    }
);

Number::$protoMethods = array(
  'valueOf' => function($this_) {
      return $this_->value;
    },
  'toString' => function($this_, $arguments, $radix = null) {
      //todo: radix
      return to_string($this_->value);
    }
);

Number::initProtoObject();
