<?php

/**
 * Used in `for..in` to get keys (including up the proto chain)
 * @param $obj
 * @param array $arr
 * @return array
 */
function keys($obj, &$arr = array()) {
  if (!($obj instanceof Object)) {
    return $arr;
  }
  return $obj->getKeys($arr);
}

function is_primitive($value) {
  return ($value === null || is_scalar($value) || $value === Null::$null || $value === NaN::$nan);
}

function is_int_or_float($value) {
  return (is_int($value) || is_float($value));
}

function to_string($value) {
  if ($value === null) {
    return 'undefined';
  }
  if ($value === Null::$null) {
    return 'null';
  }
  $type = gettype($value);
  if ($type === 'string') {
    return $value;
  }
  if ($type === 'boolean') {
    return $value ? 'true' : 'false';
  }
  if ($type === 'integer' || $type === 'double') {
    if (is_nan($value)) return 'NaN';
    if ($value === INF) return 'Infinity';
    if ($value === -INF) return '-Infinity';
    return $value . '';
  }
  if ($value === NaN::$nan) {
    return 'NaN';
  }
  if ($value instanceof Object) {
    $fn = $value->get('toString');
    if ($fn instanceof Func) {
      return $fn->call($value);
    } else {
      throw new Ex(Error::create('TypeError: Cannot convert object to primitive value'));
    }
  }
  throw new Ex(Error::create('Cannot cast PHP value to string: ' . _stringify($value)));
}

function to_number($value) {
  if ($value === null) {
    return NaN::$nan;
  }
  if ($value === Null::$null) {
    return 0.0;
  }
  if ($value === NaN::$nan) {
    return NaN::$nan;
  }
  if (is_int_or_float($value)) {
    return is_nan($value) ? NaN::$nan : (float)$value;
  }
  if (is_bool($value)) {
    return ($value ? 1.0 : 0.0);
  }
  if ($value instanceof Object) {
    return to_number(to_primitive($value));
  }
  //trim whitespace
  $value = preg_replace('/^[\\t\\x0B\\f \\xA0\\r\\n]+|[\\t\\x0B\\f \\xA0\\r\\n]+$/', '', $value);
  if ($value === '') {
    return 0.0;
  }
  if ($value === 'Infinity' || $value === '+Infinity') {
    return INF;
  }
  if ($value === '-Infinity') {
    return -INF;
  }
  if (preg_match('/^([+-]?)(\d+\.\d*|\.\d+|\d+)$/i', $value)) {
    return (float)$value;
  }
  if (preg_match('/^([+-]?)(\d+\.\d*|\.\d+|\d+)e([+-]?[0-9]+)$/i', $value, $m)) {
    return catch_nan(pow($m[1] . $m[2], $m[3]));
  }
  if (preg_match('/^0x[a-z0-9]+$/i', $value)) {
    return (float)hexdec(substr($value, 2));
  }
  return NaN::$nan;
}

/**
 * Used in to_number to handle objects
 * @param Object $obj
 * @return mixed
 */
function to_primitive($obj) {
  $value = $obj->callMethod('valueOf');
  if ($value instanceof Object) {
    $value = to_string($value);
  }
  return $value;
}

/**
 * Used in math functions to ensure we don't ever get PHP's NAN
 * @param int|float $num
 * @return float|NaN
 */
function catch_nan($num) {
  return is_nan($num) ? NaN::$nan : (float)$num;
}

/**
 * Used to get/set properties on primitives
 * @param $value
 * @return Object
 */
function objectify($value) {
  $type = gettype($value);
  if ($type === 'string') {
    return new Str($value);
  } elseif ($type === 'integer' || $type === 'double') {
    return new Number($value);
  } elseif ($type === 'boolean') {
    return new Bln($value);
  }
  return $value;
}


//getters, setters and function callers

/**
 * get a property from a primitive or Object
 * @param null|string|float|bool|Object|Null $obj
 * @param string $name
 * @return mixed
 * @throws Exception
 */
function get($obj, $name) {
  if ($obj === null || $obj === Null::$null) {
    throw new Ex(Error::create("TypeError: Cannot read property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  return $obj->get($name);
}

/**
 * Set a property on a primitive or Object (setting on a primitive would
 * normally be useless). The operator specified can be =, +=, *=, etc.
 * @param null|string|float|bool|Object|Null $obj
 * @param string $name
 * @param $value
 * @param string $op
 * @param bool $returnOld
 * @return float|int|null|string
 * @throws Exception
 */
function set($obj, $name, $value, $op = '=', $returnOld = false) {
  if ($obj === null || $obj === Null::$null) {
    throw new Ex(Error::create("TypeError: Cannot set property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  if ($op === '=') {
    return $obj->set($name, $value);
  }
  $oldValue = $obj->get($name);
  //todo: bitwise operators: << >> >>> & ^ |
  switch ($op) {
    case '+=':
      $newValue = x_plus($oldValue, $value);
      break;
    case '-=':
      $newValue = $oldValue - $value;
      break;
    case '*=':
      $newValue = $oldValue * $value;
      break;
    case '/=':
      $newValue = $oldValue / $value;
      break;
    case '%=':
      $newValue = $oldValue % $value;
      break;
  }
  $obj->set($name, $newValue);
  return $returnOld ? $oldValue : $newValue;
}

/**
 * Call a function from
 * @param Func $fn
 * @return mixed
 * @throws Exception
 */
function call($fn) {
  if (!($fn instanceof Func)) {
    throw new Ex(Error::create("TypeError: " . x_typeof($fn) . " is not a function"));
  }
  $args = array_slice(func_get_args(), 1);
  return $fn->apply(Object::$global, $args);
}

/**
 * @param Object $obj
 * @param string $name
 * @return mixed
 * @throws Exception
 */
function call_method($obj, $name) {
  if ($obj === null || $obj === Null::$null) {
    throw new Ex(Error::create("TypeError: Cannot read property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  $fn = $obj->get($name);
  if (!($fn instanceof Func)) {
    throw new Ex(Error::create("TypeError: " . x_typeof($fn) . " is not a function"));
  }
  $args = array_slice(func_get_args(), 2);
  return $fn->apply($obj, $args);
}
