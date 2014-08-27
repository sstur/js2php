<?php
class Debug {

  static function log() {
    $args = func_get_args();
    $len = count($args);
    $output = array();
    for ($i = 0; $i < $len; $i++) {
      $output[] = self::stringify($args[$i]);
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

  static function stringify($value) {
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
      //return '[object Array](' . count($value) . ')';
      $len = count($value);
      $output = array();
      for ($i = 0; $i < $len; $i++) {
        $output[] = self::stringify($value[$i]);
      }
      return '[object Array](' . $len . ')[' . join(', ', $output) . ']';
    }
    return '[object ' . get_class($value) . ']';
  }

}
