<?php

function x_void() {
  return null;
}

/**
 * @param Func $fn
 * @return Object
 */
function x_new($fn) {
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
function x_instanceof($obj, $fn) {
  $proto = $obj->getProto();
  $prototype = $fn->get('prototype');
  while ($proto !== Null::$null) {
    if ($proto === $prototype) {
      return true;
    }
    $proto = $proto->getProto();
  }
  return false;
}

function x_plus($a, $b) {
  //todo: to_primitive() [object -> string]
  if (gettype($a) === 'string' || gettype($a) === 'string') {
    return to_string($a) . to_string($b);
  }
  //todo: to_number()
  return $a + $b;
}

function x_negate($val) {
  return (float)(0 - $val);
}

function x_and($a, $b) {
  return $a ? $b : $a;
}

function x_or($a, $b) {
  return $a ? $a : $b;
}

/**
 * @param Object $obj
 * @param string $key
 */
function x_delete($obj, $key) {
  if (func_num_args() !== 2) {
    throw new Exception("Don't delete things that aren't properties.");
  }
  unset($obj->data->{$key});
  return true;
}

/**
 * @param string $key
 * @param Object $obj
 * @return bool
 * @throws Exception
 */
function x_in($key, $obj) {
  $key = to_string($key);
  if (!($obj instanceof Object)) {
    throw new Exception("Cannot use 'in' operator to search for '" . $key . "' in " . to_string($obj));
  }
  while ($obj !== Null::$null) {
    if (method_exists($obj, 'hasKey')) {
      if ($obj->hasKey($key)) {
        return true;
      }
    } else {
      $data = $obj->data;
      if (property_exists($data, $key)) {
        return true;
      }
    }
    $obj = $obj->getProto();
  }
  return false;
}

function x_typeof($value) {
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
