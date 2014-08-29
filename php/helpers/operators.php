<?php

function js_void() {}

/**
 * @param Func $fn
 * @return Object
 */
function js_new($fn) {
  if (property_exists($fn, 'instantiate')) {
    $instantiate = $fn->instantiate;
    $obj = $instantiate();
  } else {
    $obj = new Object();
    $obj->setProto($fn->get('prototype'));
  }
  $args = array_slice(func_get_args(), 1);
  $result = $fn->apply($obj, $args);
  return is_primitive($result) ? $obj : $result;
}

/**
 * @param Object $obj
 * @param Func $fn
 * @return bool
 */
function js_instanceof($obj, $fn) {
  $proto = $obj->getProto();
  $prototype = $fn->get('prototype');
  while ($proto !== null) {
    if ($proto === $prototype) {
      return true;
    }
    $proto = $proto->getProto();
  }
  return false;
}

function js_plus($a, $b) {
  //todo: to_primitive() [object -> string]
  if (gettype($a) === 'string' || gettype($a) === 'string') {
    return to_string($a) . to_string($b);
  }
  //todo: to_number()
  return $a + $b;
}

function js_and($a, $b) {
  return $a ? $b : $a;
}

function js_or($a, $b) {
  return $a ? $a : $b;
}

/**
 * @param Object $obj
 * @param string $key
 */
function js_delete($obj, $key) {
  unset($obj->data->{$key});
  return true;
}

/**
 * @param string $key
 * @param Object $obj
 * @return bool
 * @throws Exception
 */
function js_in($key, $obj) {
  $key = to_string($key);
  if (!($obj instanceof Object)) {
    throw new Exception("Cannot use 'in' operator to search for '" . $key . "' in " . to_string($obj));
  }
  while ($obj !== null) {
    $data = $obj->data;
    if (property_exists($data, $key)) {
      return true;
    }
    $obj = $obj->proto;
  }
  return false;
}

function js_typeof($value) {
  if ($value === null) {
    return 'undefined';
  }
  //js weirdness
  if ($value === Null::$null) {
    return 'object';
  }
  if ($value === NaN::$nan) {
    return 'number';
  }
  $type = gettype($value);
  if ($type === 'integer' || $type === 'double') {
    return 'number';
  }
  if ($type === 'string' || $type === 'boolean') {
    return $type;
  }
  if ($value instanceof Object) {
    return $value->type;
  }
  return 'unknown';
}
