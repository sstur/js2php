<?php
//todo: use unicode string functions
class GlobalObject extends Object {
  public $className = "[object global]";

  function set($key, $value) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    return ($GLOBALS[$key] = $value);
  }

  function get($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    return $GLOBALS[$key];
  }

  //keys will produce the list of keys that are considered to be enumerable
  function keys() {
    $keys = array();
    foreach ($GLOBALS as $key => $value) {
      if (!preg_match('/[^_]_$/', $key)) {
        $key = preg_replace('/__$/', '_', $key);
        $key = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $key);
        if (self::isValidType($value)) {
          $keys[] = $key;
        }
      }
    }
    return $keys;
  }

  //determine if a valid value exists at the given key
  function hasKey($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, $GLOBALS)) {
      if (self::isValidType($GLOBALS[$key])) {
        return true;
      }
    }
    return false;
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
