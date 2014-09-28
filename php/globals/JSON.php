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
      foreach ($value as $item) {
        $result->push($decode($item));
      }
    } else {
      $result = new Object();
      foreach ($value as $key => $item) {
        $result->set($key, $decode($item));
      }
    }
    return $result;
  };

  $escape = function($str) {
    return str_replace("\\/", "/", json_encode($str));
  };

  $encode = function($value, $inArray = false) use (&$escape, &$encode) {
    if ($value === null) {
      return $inArray ? 'null' : $value;
    }
    if ($value === Null::$null || $value === INF || $value === -INF) {
      return 'null';
    }
    $type = gettype($value);
    if ($type === 'boolean') {
      return $value ? 'true' : 'false';
    }
    if ($type === 'integer' || $type === 'double') {
      return is_nan($value) ? 'null' : $value . '';
    }
    if ($type === 'string') {
      return $escape($value);
    }
    if ($value instanceof Arr) {
      $result = array();
      $len = $value->length;
      for ($i = 0; $i < $len; $i++) {
        $result[] = $encode($value->get($i), true);
      }
      return '[' . join(',', $result) . ']';
    }
    //class may specify its own toJSON (date/buffer)
    if (method_exists($value, 'toJSON')) {
      return $encode($value->toJSON());
    }
    $toJSON = $value->get('toJSON');
    if ($toJSON instanceof Func) {
      return $encode($toJSON->call($value));
    }
    $valueOf = $value->get('valueOf');
    if ($valueOf instanceof Func) {
      $primitiveValue = $valueOf->call($value);
      if ($primitiveValue !== $value) {
        return $encode($primitiveValue);
      }
    }
    $result = array();
    foreach ($value->getOwnKeys(true) as $key) {
      $val = $value->get($key);
      if ($val !== null) {
        $result[] = $escape($key) . ':' . $encode($val);
      }
    }
    return '{' . join(',', $result) . '}';
  };

  $methods = array(
    'parse' => function($this_, $arguments, $string) use(&$decode) {
        $value = json_decode($string);
        return $decode($value);
      },
    'stringify' => function($this_, $arguments, $value) use (&$encode) {
        return $encode($value);
      }
  );

  $JSON = new Object();
  $JSON->setMethods($methods, true, false, true);
  return $JSON;
});
