<?php
$JSON = call_user_func(function() {

  $decode = function($value) use (&$decode) {
    if ($value === null) {
      return Null::$null;
    }
    $type = gettype($value);
    if ($type === 'integer') {
      return (float)$value;
    }
    if ($type === 'string' || $type === 'boolean' || $type === 'double') {
      return $value;
    }
    if ($type === 'array') {
      $result = new Arr();
      $len = count($value);
      for ($i = 0; $i < $len; $i++) {
        $result->push($decode($value[$i]));
      }
    } else {
      $result = new Object();
      foreach ($value as $key => $item) {
        $result->set($key, $decode($item));
      }
    }
    return $result;
  };

  $methods = array(
    'parse' => function($this_, $arguments, $string) use(&$decode) {
        $value = json_decode($string);
        return $decode($value);
      },
    'stringify' => function($this_, $arguments, $value) {
        return json_encode($value);
      }
  );

  $JSON = new Object();
  $JSON->setMethods($methods, true, false, true);
  return $JSON;
});
