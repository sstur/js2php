<?php

function _void() {
  return null;
}

/**
 * @param Func $fn
 * @return Object
 * @throws Exception
 */
function _new($fn) {
  if (!($fn instanceof Func)) {
    throw new Ex(Error::create(_typeof($fn) . " is not a function"));
  }
  $args = array_slice(func_get_args(), 1);
  return call_user_func_array(array($fn, 'construct'), $args);
}

/**
 * @param Object $obj
 * @param Func $fn
 * @return bool
 */
function _instanceof($obj, $fn) {
  if (!($obj instanceof Object)) {
    return false;
  }
  if (!($fn instanceof Func)) {
    throw new Ex(Error::create('Expecting a function in instanceof check'));
  }
  $proto = $obj->proto;
  $prototype = get($fn, 'prototype');
  while ($proto !== Object::$null) {
    if ($proto === $prototype) {
      return true;
    }
    $proto = $proto->proto;
  }
  return false;
}

function _divide($a, $b) {
  $a = to_number($a);
  $b = to_number($b);
  if ($b === 0.0) {
    if ($a === 0.0) return NAN;
    return ($a < 0.0) ? -INF : INF;
  }
  return $a / $b;
}

function _plus() {
  $total = 0;
  $strings = array();
  $isString = false;
  foreach (func_get_args() as $arg) {
    if (is_string($arg)) {
      $isString = true;
    }
    $strings[] = to_string($arg);
    if (!$isString) {
      $total += to_number($arg);
    }
  }
  return $isString ? join('', $strings) : $total;
}

function _concat() {
  $strings = array();
  foreach (func_get_args() as $arg) {
    $strings[] = to_string($arg);
  }
  return join('', $strings);
}

function _negate($val) {
  return (float)(0 - $val);
}

function _and($a, $b) {
  return $a ? $b : $a;
}

function _or($a, $b) {
  return $a ? $a : $b;
}

/**
 * @param $obj
 * @param null $key
 * @return bool
 * @throws Exception
 */
function _delete($obj, $key = null) {
  //don't allow deleting of variables, only properties
  if (func_num_args() === 1) {
    return false;
  }
  if ($obj === null || $obj === Object::$null) {
    throw new Ex(Error::create("Cannot convert undefined or null to object"));
  }
  $obj = objectify($obj);
  $obj->remove($key);
  return true;
}

/**
 * @param string $key
 * @param Object $obj
 * @return bool
 * @throws Exception
 */
function _in($key, $obj) {
  if (!($obj instanceof Object)) {
    throw new Ex(Error::create("Cannot use 'in' operator to search for '" . $key . "' in " . to_string($obj)));
  }
  return $obj->hasProperty($key);
}

function _typeof($value) {
  if ($value === null) {
    return 'undefined';
  }
  //js weirdness
  if ($value === Object::$null) {
    return 'object';
  }
  $type = gettype($value);
  if ($type === 'integer' || $type === 'double') {
    return 'number';
  }
  if ($type === 'string' || $type === 'boolean') {
    return $type;
  }
  if ($value instanceof Func) {
    return 'function';
  }
  if ($value instanceof Object) {
    return 'object';
  }
  return 'unknown';
}

function _seq() {
  $args = func_get_args();
  return array_pop($args);
}
