<?php
//todo: use unicode string functions
class GlobalObject extends Object {
  public $className = "[object global]";

  //disallow mutating pre-defined globals
  static $immutable = array('Array' => 1, 'Boolean' => 1, 'Buffer' => 1, 'Date' => 1, 'Error' => 1, 'Function' => 1, 'Infinity' => 1, 'JSON' => 1, 'Math' => 1, 'NaN' => 1, 'Number' => 1, 'Object' => 1, 'RegExp' => 1, 'String' => 1, 'console' => 1, 'decodeURI' => 1, 'decodeURIComponent' => 1, 'encodeURI' => 1, 'encodeURIComponent' => 1, 'escape' => 1, 'eval' => 1, 'isFinite' => 1, 'isNaN' => 1, 'parseFloat' => 1, 'parseInt' => 1, 'undefined' => 1, 'unescape' => 1);
  //copy of the GLOBALS array
  static $GLOBALS = null;
  //copy of the contents of GLOBALS array
  static $OLD_GLOBALS = null;

  static $protoObject = null;
  static $classMethods = null;

  function set($key, $value) {
    if (array_key_exists($key, self::$immutable)) {
      return $value;
    }
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    return (self::$GLOBALS[$key] = $value);
  }

  function get($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    $value = array_key_exists($key, self::$GLOBALS) ? self::$GLOBALS[$key] : null;
    return $value;
  }

  function remove($key) {
    if (array_key_exists($key, self::$immutable)) {
      return false;
    }
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, self::$GLOBALS)) {
      unset(self::$GLOBALS[$key]);
    }
    return true;
  }

  //determine if a valid value exists at the given key (don't walk proto)
  function hasOwnProperty($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    return array_key_exists($key, self::$GLOBALS);
  }

  //determine if a valid value exists at the given key (walk proto)
  function hasProperty($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $key);
    if (array_key_exists($key, self::$GLOBALS)) {
      return true;
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
    foreach (self::$GLOBALS as $key => $value) {
      if (!preg_match('/[^_]_$/', $key)) {
        $key = preg_replace('/__$/', '_', $key);
        $key = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $key);
        $arr[] = $key;
      }
    }
    return $arr;
  }

  //produce the list of keys (walk proto)
  function getKeys(&$arr = array()) {
    foreach (self::$GLOBALS as $key => $value) {
      if (!preg_match('/[^_]_$/', $key)) {
        $key = preg_replace('/__$/', '_', $key);
        $key = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $key);
        $arr[] = $key;
      }
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      $proto->getKeys($arr);
    }
    return $arr;
  }

  static function encodeChar($matches) {
    return '«' . bin2hex($matches[0]) . '»';
  }

  static function decodeChar($matches) {
    return hex2bin($matches[1]);
  }

  static function unsetGlobals() {
    self::$OLD_GLOBALS = array();
    foreach ($GLOBALS as $key => $value) {
      if ($value !== $GLOBALS) {
        self::$OLD_GLOBALS[$key] = $value;
        unset($GLOBALS[$key]);
      }
    }
    self::$GLOBALS = $GLOBALS;
    unset($GLOBALS['GLOBALS']);
  }

}

GlobalObject::unsetGlobals();
Object::$global = new GlobalObject();
