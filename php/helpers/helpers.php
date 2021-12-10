<?php

/**
 * Determine if a value is "truthy" which is anything besides: null,
 *   undefined, false, empty string, zero or NaN
 *   Used in `if`, `for`, `while`, ternary and logical operators
 * @param $x
 * @return bool
 */
function is($x) {
  return $x !== false && $x !== 0.0 && $x !== '' && $x !== null && $x !== ObjectClass::$null && $x === $x /* NaN check */;
}

/**
 * Determine if a value is "falsy". Just the opposite of `is()`
 * @param $x
 * @return bool
 */
function not($x) {
  return $x === false || $x === 0.0 || $x === '' || $x === null || $x === ObjectClass::$null || $x !== $x /* NaN check */;
}

/**
 * Non-strict equality (==) using type coercion
 *   http://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/
 * @param $a
 * @param $b
 * @return bool
 */
function eq($a, $b) {
  $typeA = ($a === null || $a === ObjectClass::$null ? 'null' : ($a instanceof ObjectClass ? 'object' : gettype($a)));
  $typeB = ($b === null || $b === ObjectClass::$null ? 'null' : ($b instanceof ObjectClass ? 'object' : gettype($b)));
  if ($typeA === 'null' && $typeB === 'null') {
    return true;
  }
  if ($typeA === 'integer') {
    $a = (float)$a;
    $typeA = 'double';
  }
  if ($typeB === 'integer') {
    $b = (float)$b;
    $typeB = 'double';
  }
  if ($typeA === $typeB) {
    return $a === $b;
  }
  if ($typeA === 'double' && $typeB === 'string') {
    return $a === to_number($b);
  }
  if ($typeB === 'double' && $typeA === 'string') {
    return $b === to_number($a);
  }
  if ($typeA === 'boolean') {
    return eq((float)$a, $b);
  }
  if ($typeB === 'boolean') {
    return eq((float)$b, $a);
  }
  if (($typeA === 'string' || $typeA === 'double') && $typeB === 'object') {
    return eq($a, to_primitive($b));
  }
  if (($typeB === 'string' || $typeB === 'double') && $typeA === 'object') {
    return eq($b, to_primitive($a));
  }
  return false;
}

/**
 * Implements non-strict comparison operators.
 * @param mixed $a
 * @param string $operator <, >, <= or =>
 * @param mixed $b
 * @return bool
 */
function cmp($a, $operator, $b) {
    $typeA = ($a === null || $a === ObjectClass::$null ? 'null' : ($a instanceof ObjectClass ? 'object' : gettype($a)));
    $typeB = ($b === null || $b === ObjectClass::$null ? 'null' : ($b instanceof ObjectClass ? 'object' : gettype($b)));
    $isNumberA = in_array($typeA, ['integer', 'double']);
    $isNumberB = in_array($typeB, ['integer', 'double']);
    if ($isNumberA && $isNumberB) {
        // Most common case, nothing to do. Due to performance reasons we put this case first
        // to skip all other checks.
    } else
        if ($typeA === 'string' && $typeB === 'string') {
        // two strings are compared lexically in JavaScript, even if both could be converted to numbers
        $a = strcmp($a, $b);
        $b = 0;
    } else if ($typeA === 'string' && $isNumberB) {
        $a = to_number($a);
    } else if ($typeB === 'string' && $isNumberA) {
        $b = to_number($b);
    }
    switch ($operator) {
        case '<':
            return $a < $b;
        case '>':
            return $a > $b;
        case '<=':
            return $a <= $b;
        case '>=':
            return $a >= $b;
    }
}

/**
 * Used in `for..in` to get keys (including up the proto chain)
 * @param ObjectClass $obj
 * @param array $arr
 * @return array
 */
function keys($obj, &$arr = array()) {
  if (!($obj instanceof ObjectClass)) {
    return $arr;
  }
  return $obj->getKeys($arr);
}

function is_primitive($value) {
  return ($value === null || $value === ObjectClass::$null || is_scalar($value));
}

function is_int_or_float($value) {
  return (is_int($value) || is_float($value));
}

function to_string($value) {
  if ($value === null) {
    return 'undefined';
  }
  if ($value === ObjectClass::$null) {
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
    if ($value !== $value) return 'NaN';
    if ($value === INF) return 'Infinity';
    if ($value === -INF) return '-Infinity';
    return $value . '';
  }
  if ($value instanceof ObjectClass) {
    $fn = $value->get('toString');
    if ($fn instanceof Func) {
      return $fn->call($value);
    } else {
      throw new Ex(Err::create('Cannot convert object to primitive value'));
    }
  }
  throw new Ex(Err::create('Cannot cast PHP value to string: ' . _stringify($value)));
}

function to_number($value) {
  if ($value === null) {
    return NAN;
  }
  if ($value === ObjectClass::$null) {
    return 0.0;
  }
  if (is_float($value)) {
    return $value;
  }
  if (is_numeric($value)) {
    return (float)$value;
  }
  if (is_bool($value)) {
    return ($value ? 1.0 : 0.0);
  }
  if ($value instanceof ObjectClass) {
    return to_number(to_primitive($value));
  }
  //trim whitespace
  $value = preg_replace('/^[\s\x0B\xA0]+|[\s\x0B\xA0]+$/u', '', $value);
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
    return pow($m[1] . $m[2], $m[3]);
  }
  if (preg_match('/^0x[a-z0-9]+$/i', $value)) {
    return (float)hexdec(substr($value, 2));
  }
  return NAN;
}

/**
 * Used in to_number/eq to handle objects
 * @param ObjectClass $obj
 * @return mixed
 */
function to_primitive($obj) {
  $value = $obj->callMethod('valueOf');
  if ($value instanceof ObjectClass) {
    $value = to_string($value);
  }
  return $value;
}

/**
 * Used to get/set properties on primitives
 * @param $value
 * @return ObjectClass
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
 * @param null|string|float|bool|ObjectClass|Null $obj
 * @param string $name
 * @return mixed
 * @throws Exception
 */
function get($obj, $name) {
  if ($obj === null || $obj === ObjectClass::$null) {
    throw new Ex(Err::create("Cannot read property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  return $obj->get($name);
}

/**
 * Set a property on a primitive or Object (setting on a primitive would
 * normally be useless). The operator specified can be =, +=, *=, etc.
 * @param null|string|float|bool|ObjectClass|Null $obj
 * @param string $name
 * @param $value
 * @param string $op
 * @param bool $returnOld
 * @return float|int|null|string
 * @throws Exception
 */
function set($obj, $name, $value, $op = '=', $returnOld = false) {
  if ($obj === null || $obj === ObjectClass::$null) {
    throw new Ex(Err::create("Cannot set property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  if ($op === '=') {
    return $obj->set($name, $value);
  }
  $oldValue = $obj->get($name);
  //todo: bitwise operators: << >> >>> & ^ |
  switch ($op) {
    case '+=':
      $newValue = _plus($oldValue, $value);
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
    throw new Ex(Err::create(_typeof($fn) . " is not a function"));
  }
  $args = array_slice(func_get_args(), 1);
  return $fn->apply(ObjectClass::$global, $args);
}

/**
 * @param ObjectClass $obj
 * @param string $name
 * @return mixed
 * @throws Exception
 */
function call_method($obj, $name) {
  if ($obj === null || $obj === ObjectClass::$null) {
    throw new Ex(Err::create("Cannot read property '" . $name . "' of " . to_string($obj)));
  }
  $obj = objectify($obj);
  $fn = $obj->get($name);
  if (!($fn instanceof Func)) {
    throw new Ex(Err::create(_typeof($fn) . " is not a function"));
  }
  $args = array_slice(func_get_args(), 2);
  return $fn->apply($obj, $args);
}

/**
 * @param resource $stream
 * @param string $data
 * @param int|float|null $bytesTotal
 */
function write_all($stream, $data, $bytesTotal = null) {
  if ($bytesTotal === null) {
    $bytesTotal = strlen($data);
  }
  $bytesWritten = fwrite($stream, $data);
  //some platforms require multiple calls to fwrite
  while ($bytesWritten < $bytesTotal) {
    $bytesWritten += fwrite($stream, substr($data, $bytesWritten));
  }
}
