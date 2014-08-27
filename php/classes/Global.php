<?php
class GlobalObject extends Object {

  function set($key, $value) {
    throw new Exception('Cannot mutate global object');
  }

  function get($key) {
    $key = preg_replace('/_$/', '__', $key);
    $key = preg_replace_callback('/[^a-z0-9_]/', 'self::encodeChar', $key);
    return $GLOBALS[$key];
  }

  static function encodeChar($ch) {
    return '«' . bin2hex($ch) . '»';
  }

}
