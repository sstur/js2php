<?php
class Number extends Object {
  public $className = "Number";
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

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Number = new Func(function($value = 0) {
      $self = Func::getContext();
      if ($self instanceof Number) {
        $self->value = to_number($value);
        return $self;
      } else {
        return to_number($value);
      }
    });
    $Number->instantiate = function() {
      return new Number();
    };
    $Number->set('prototype', Number::$protoObject);
    $Number->setMethods(Number::$classMethods, true, false, true);
    //constants
    $Number->set('NaN', NAN);
    $Number->set('MAX_VALUE', 1.8e308);
    $Number->set('MIN_VALUE', -1.8e308);
    $Number->set('NEGATIVE_INFINITY', -INF);
    $Number->set('POSITIVE_INFINITY', INF);
    return $Number;
  }
}

Number::$classMethods = array(
  'isFinite' => function($value) {
      $value = to_number($value);
      return !($value === INF || $value === -INF || is_nan($value));
    },
  'parseInt' => function($value, $radix = null) {
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
        if (is_nan($radix) || $radix < 2 || $radix > 36) {
          return NAN;
        }
      }
      if ($radix === 10) {
        return preg_match('/^[0-9]/', $value) ? (float)(intval($value) * $sign) : NAN;
      } elseif ($radix === 16) {
        $value = preg_replace('/^0x/i', '', $value);
        return preg_match('/^[0-9a-f]/i', $value) ? (float)(hexdec($value) * $sign) : NAN;
      } elseif ($radix === 8) {
        return preg_match('/^[0-7]/', $value) ? (float)(octdec($value) * $sign) : NAN;
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
      return NAN;
    },
  'parseFloat' => function($value) {
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
      return NAN;
    },
  'isNaN' => function($value) {
      return is_nan(to_number($value));
    }
);

Number::$protoMethods = array(
  'valueOf' => function() {
      $self = Func::getContext();
      return $self->value;
    },
  'toString' => function($radix = null) {
      $self = Func::getContext();
      //todo: radix
      return to_string($self->value);
    }
);

Number::$protoObject = new Object();
Number::$protoObject->setMethods(Number::$protoMethods, true, false, true);
