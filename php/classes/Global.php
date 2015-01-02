<?php
class GlobalObject extends Object {
  public $className = "global";

  //disallow mutating pre-defined globals
  static $immutable = array('Array' => 1, 'Boolean' => 1, 'Buffer' => 1, 'Date' => 1, 'Error' => 1, 'RangeError' => 1, 'ReferenceError' => 1, 'SyntaxError' => 1, 'TypeError' => 1, 'Function' => 1, 'Infinity' => 1, 'JSON' => 1, 'Math' => 1, 'NaN' => 1, 'Number' => 1, 'Object' => 1, 'RegExp' => 1, 'String' => 1, 'console' => 1, 'decodeURI' => 1, 'decodeURIComponent' => 1, 'encodeURI' => 1, 'encodeURIComponent' => 1, 'escape' => 1, 'eval' => 1, 'isFinite' => 1, 'isNaN' => 1, 'parseFloat' => 1, 'parseInt' => 1, 'undefined' => 1, 'unescape' => 1);
  //copy of GLOBALS that we have deleted (if any)
  static $OLD_GLOBALS = null;
  //a list of PHP's superglobals (cannot be accessed via set/get/remove)
  static $SUPER_GLOBALS = array('GLOBALS' => 1, '_SERVER' => 1, '_GET' => 1, '_POST' => 1, '_FILES' => 1, '_COOKIE' => 1, '_SESSION' => 1, '_REQUEST' => 1, '_ENV' => 1);

  static $protoObject = null;
  static $classMethods = null;

  function set($key, $value) {
    if (array_key_exists($key, self::$immutable)) {
      return $value;
    }
    $key = self::encodeVar($key);
    return ($GLOBALS[$key] = $value);
  }

  function get($key) {
    $key = self::encodeVar($key);
    $value = array_key_exists($key, $GLOBALS) ? $GLOBALS[$key] : null;
    return $value;
  }

  function remove($key) {
    if (array_key_exists($key, self::$immutable)) {
      return false;
    }
    $key = self::encodeVar($key);
    if (array_key_exists($key, $GLOBALS)) {
      unset($GLOBALS[$key]);
    }
    return true;
  }

  //determine if a valid value exists at the given key (don't walk proto)
  function hasOwnProperty($key) {
    $key = self::encodeVar($key);
    return array_key_exists($key, $GLOBALS);
  }

  //determine if a valid value exists at the given key (walk proto)
  function hasProperty($key) {
    $key = self::encodeVar($key);
    if (array_key_exists($key, $GLOBALS)) {
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
    foreach ($GLOBALS as $key => $value) {
      if (!array_key_exists($key, self::$SUPER_GLOBALS)) {
        $arr[] = self::decodeVar($key);
      }
    }
    return $arr;
  }

  //produce the list of keys (walk proto)
  function getKeys(&$arr = array()) {
    foreach ($GLOBALS as $key => $value) {
      if (!array_key_exists($key, self::$SUPER_GLOBALS)) {
        $arr[] = self::decodeVar($key);
      }
    }
    $proto = $this->proto;
    if ($proto instanceof Object) {
      $proto->getKeys($arr);
    }
    return $arr;
  }

  static function encodeVar($str) {
    if (array_key_exists($str, self::$SUPER_GLOBALS)) {
      return $str . '_';
    }
    $str = preg_replace('/_$/', '__', $str);
    $str = preg_replace_callback('/[^a-zA-Z0-9_]/', 'self::encodeChar', $str);
    return $str;
  }

  static function encodeChar($matches) {
    return '«' . bin2hex($matches[0]) . '»';
  }

  static function decodeVar($str) {
    $len = strlen($str);
    if ($str[$len - 1] === '_') {
      $name = substr($str, 0, $len - 1);
      if (array_key_exists($name, self::$SUPER_GLOBALS)) {
        return $name;
      }
    }
    $str = preg_replace('/__$/', '_', $str);
    $str = preg_replace_callback('/«([a-z0-9]+)»/', 'self::decodeChar', $str);
    return $str;
  }

  static function decodeChar($matches) {
    //note: this is a workaround for when hex2bin() is not available (v5.3)
    //todo: ensure the hex string length is not odd
    return pack('H*', $matches[1]);
  }

  static function unsetGlobals() {
    self::$OLD_GLOBALS = array();
    foreach ($GLOBALS as $key => $value) {
      if (!array_key_exists($key, self::$SUPER_GLOBALS)) {
        self::$OLD_GLOBALS[$key] = $value;
        unset($GLOBALS[$key]);
      }
    }
  }

}

GlobalObject::unsetGlobals();
Object::$global = new GlobalObject();
