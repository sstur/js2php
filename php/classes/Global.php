<?php
//todo: use unicode string functions
class GlobalObject extends Object {
  public $className = "[object global]";

  static $protoObject = null;
  static $classMethods = null;

  function set($key, $value) {
    //disallow setting `undefined`
    if ($key === 'undefined') return $value;
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, $GLOBALS)) {
      if (!self::isValidType($GLOBALS[$key])) {
        return $value;
      }
    }
    return ($GLOBALS[$key] = $value);
  }

  function get($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    $value = $GLOBALS[$key];
    return (self::isValidType($value)) ? $value : null;
  }

  function remove($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, $GLOBALS)) {
      if (self::isValidType($GLOBALS[$key])) {
        unset($GLOBALS[$key]);
      }
    }
    return true;
  }

  //determine if a valid value exists at the given key (don't walk proto)
  function hasOwnProperty($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, $GLOBALS)) {
      if (self::isValidType($GLOBALS[$key])) {
        return true;
      }
    }
    return false;
  }

  //determine if a valid value exists at the given key (walk proto)
  function hasProperty($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, $GLOBALS)) {
      if (self::isValidType($GLOBALS[$key])) {
        return true;
      }
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      return $proto->hasProperty($key);
    }
    return false;
  }

  //produce the list of keys (all globals are enumerable)
  function getOwnKeys($onlyEnumerable) {
    $arr = array();
    foreach ($GLOBALS as $key => $value) {
      if (!preg_match('/[^_]_$/', $key)) {
        $key = preg_replace('/__$/', '_', $key);
        $key = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $key);
        if (self::isValidType($value)) {
          $arr[] = $key;
        }
      }
    }
    return $arr;
  }

  //produce the list of keys (walk proto)
  function getKeys(&$arr = array()) {
    foreach ($GLOBALS as $key => $value) {
      if (!preg_match('/[^_]_$/', $key)) {
        $key = preg_replace('/__$/', '_', $key);
        $key = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $key);
        if (self::isValidType($value)) {
          $arr[] = $key;
        }
      }
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      $proto->getKeys($arr);
    }
    return $arr;
  }

  static function isValidType($value) {
    if ($value === null || $value === Null::$null || $value === NaN::$nan) {
      return true;
    }
    if ($value instanceof Object) {
      return true;
    }
    $type = gettype($value);
    if ($type === 'string' || $type === 'boolean' || $type === 'double') {
      return true;
    }
    return false;
  }

  static function encodeChar($matches) {
    return '«' . bin2hex($matches[0]) . '»';
  }

  static function decodeChar($matches) {
    return hex2bin($matches[1]);
  }

}
