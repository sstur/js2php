<?php
class Debug {
  static $MAX_DEPTH = 3;

  static function log() {
    $output = array();
    foreach (func_get_args() as $arg) {
      $output[] = self::stringify($arg);
    }
    echo join(' ', $output) . "\n";
  }

  static function dump() {
    ob_start();
    call_user_func_array('var_dump', func_get_args());
    $output = ob_get_contents();
    ob_end_clean();
    $output = preg_replace('/\n+$/', '', $output);
    echo $output . "\n";
  }

  static function keys($value) {
    $keys = array();
    foreach ($value as $key => $item) {
      $keys[] = $key;
    }
    return join(", ", $keys);
  }

  static function stringify($value, $depth = 0) {
    if ($value === null) {
      return 'null';
    }
    $type = gettype($value);
    if ($type === 'boolean') {
      return $value ? 'true' : 'false';
    }
    if ($type === 'string' || $type === 'integer' || $type === 'double') {
      return $value . '';
    }
    if ($type === 'array') {
      if ($depth >= self::$MAX_DEPTH) {
        return '[object Array](' . count($value) . ')[...]';
      }
      $output = array();
      foreach ($value as $item) {
        $output[] = self::stringify($item, $depth + 1);
      }
      return '[object Array](' . count($value) . ')[' . join(', ', $output) . ']';
    }
    return '[object ' . get_class($value) . ']';
  }

}
