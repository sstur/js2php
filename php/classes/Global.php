<?php
class GlobalObject extends Object {

  function set($key, $value) {
    throw new Exception('Cannot mutate global object');
  }

  function get($key) {
    //todo: translate $key
    return $GLOBALS[$key];
  }

}
