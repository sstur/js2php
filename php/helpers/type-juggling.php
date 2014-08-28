<?php

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
      throw new Exception('TypeError: Cannot convert object to primitive value');
    }
  }
  throw new Exception('Cannot cast PHP value to string: ' . _stringify($value));
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

//used in to_number to handle objects
function to_primitive($obj) {
  $value = $obj->callMethod('valueOf');
  if ($value instanceof Object) {
    $value = to_string($value);
  }
  return $value;
}

//used in math functions to ensure we don't ever get PHP's NAN
function catch_nan($num) {
  return is_nan($num) ? NaN::$nan : (float)$num;
}

//used to get/set properties on primitives
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
function get($obj, $name) {
  if ($obj === null || $obj === Null::$null) {
    throw new Exception("TypeError: Cannot read property '$name' of " . to_string($obj));
  }
  $obj = objectify($obj);
  return $obj->get($name);
}

function set($obj, $name, $value) {
  if ($obj === null || $obj === Null::$null) {
    throw new Exception("TypeError: Cannot set property '$name' of " . to_string($obj));
  }
  $obj = objectify($obj);
  return $obj->set($name, $value);
}

function call($fn) {
  if (!($fn instanceof Func)) {
    throw new Exception("TypeError: " . js_typeof($fn) . " is not a function");
  }
  $args = array_slice(func_get_args(), 1);
  return $fn->apply(Object::$global, $args);
}

function call_method($obj, $name) {
  if ($obj === null || $obj === Null::$null) {
    throw new Exception("TypeError: Cannot read property '$name' of " . to_string($obj));
  }
  $obj = objectify($obj);
  $fn = $obj->get($name);
  if (!($fn instanceof Func)) {
    throw new Exception("TypeError: " . js_typeof($fn) . " is not a function");
  }
  $args = array_slice(func_get_args(), 2);
  return $fn->apply($obj, $args);
}
