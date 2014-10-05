<?php
class Test {
  static $stack = array();

  static function suite($name, $fn) {
    array_push(self::$stack, $name);
    $fn(function($description, $condition) {
      Test::assert($description, $condition);
    });
    array_pop(self::$stack);
  }

  static function assert($description, $condition = false) {
    if ($condition instanceof Closure) {
      $condition = $condition();
    }
    if ($condition !== true) {
      $stack = array_slice(self::$stack, 0);
      array_push($stack, $description);
      throw new Ex(Error::create('Test Failure: ' . join(': ', $stack)));
    }
  }

}
