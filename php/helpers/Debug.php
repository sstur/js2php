<?php
class Debug {
  static $MAX_DEPTH = 3;
  static $inspect = null;

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

//this is generated from JS; loosely based on inspect module from Node.js
Debug::$inspect = call_user_func(function() use (&$Date, &$Object, &$RegExp, &$JSON, &$Error, &$String, &$Array) {
  $inspect = new Func("inspect", function($obj = null, $depth = null) use (&$stylizeNoColor, &$formatValue) {
    $ctx = new Object("seen", new Arr(), "stylize", $stylizeNoColor);
    return call($formatValue, $ctx, $obj, _typeof($depth) === "undefined" ? 2.0 : $depth);
  });
  $stylizeNoColor = new Func("stylizeNoColor", function($str = null, $styleType = null) {
    return $str;
  });
  $formatValue = new Func("formatValue", function($ctx = null, $value = null, $recurseTimes = null) use (&$inspect, &$isDate, &$Date, &$formatPrimitive, &$Object, &$isRegExp, &$RegExp, &$isError, &$formatError, &$isArray, &$formatArray, &$reduceToSingleString, &$formatProperty) {
    if (is($value) && _typeof(get($value, "inspect")) === "function" && get($value, "inspect") !== $inspect && not((is($and_ = get($value, "constructor")) ? get(get($value, "constructor"), "prototype") === $value : $and_))) {
      return call_method($value, "inspect", $recurseTimes);
    }
    if (is(call($isDate, $value))) {
      return call_method($ctx, "stylize", call_method(get(get($Date, "prototype"), "toUTCString"), "call", $value), "date");
    }
    if (is($value) && eq(_typeof(get($value, "valueOf")), "function")) {
      $value = call_method($value, "valueOf");
    }
    $primitive = call($formatPrimitive, $ctx, $value);
    if (is($primitive)) {
      return $primitive;
    }
    if (_typeof($value) === "object" && !_instanceof($value, $Object)) {
      return call_method($ctx, "stylize", "[object Object]", "special");
    }
    $keys = call_method($Object, "keys", $value);
    if (get($keys, "length") === 0.0) {
      if (_typeof($value) === "function") {
        $name = is(get($value, "name")) ? _concat(": ", get($value, "name")) : "";
        return call_method($ctx, "stylize", _concat("[Function", $name, "]"), "special");
      }
      if (is(call($isRegExp, $value))) {
        return call_method($ctx, "stylize", call_method(get(get($RegExp, "prototype"), "toString"), "call", $value), "regexp");
      }
      if (is(call($isError, $value))) {
        return call($formatError, $value);
      }
    }
    $base = ""; $array = false; $braces = new Arr("{", "}");
    if (is(call($isArray, $value))) {
      $array = true;
      $braces = new Arr("[", "]");
    }
    if (_typeof($value) === "function") {
      $n = is(get($value, "name")) ? _concat(": ", get($value, "name")) : "";
      $base = _concat(" [Function", $n, "]");
    }
    if (is(call($isRegExp, $value))) {
      $base = _concat(" ", call_method(get(get($RegExp, "prototype"), "toString"), "call", $value));
    }
    if (is(call($isDate, $value))) {
      $base = _concat(" ", call_method(get(get($Date, "prototype"), "toUTCString"), "call", $value));
    }
    if (is(call($isError, $value))) {
      $base = _concat(" ", call($formatError, $value));
    }
    if (get($keys, "length") === 0.0 && not($array) || get($value, "length") === 0.0) {
      return _plus(get($braces, 0.0), $base, get($braces, 1.0));
    }
    if ($recurseTimes < 0.0) {
      if (is(call($isRegExp, $value))) {
        return call_method($ctx, "stylize", call_method(get(get($RegExp, "prototype"), "toString"), "call", $value), "regexp");
      } else {
        return call_method($ctx, "stylize", "[Object]", "special");
      }

    }
    call_method(get($ctx, "seen"), "push", $value);
    if (is($array)) {
      $output = call($formatArray, $ctx, $value, $recurseTimes, $keys, $keys);
    } else {
      $output = call_method($keys, "map", new Func(function($key = null) use (&$formatProperty, &$ctx, &$value, &$recurseTimes, &$keys, &$array) {
        return call($formatProperty, $ctx, $value, $recurseTimes, $keys, $key, $array);
      }));
    }

    call_method(get($ctx, "seen"), "pop");
    return call($reduceToSingleString, $output, $base, $braces);
  });
  $formatPrimitive = new Func("formatPrimitive", function($ctx = null, $value = null) use (&$JSON) {
    switch (_typeof($value)) {
      case "undefined":
        return call_method($ctx, "stylize", "undefined", "undefined");
      case "string":
        $simple = _concat("'", call_method(call_method(call_method(call_method($JSON, "stringify", $value), "replace", new RegExp("^\"|\"\$", "g"), ""), "replace", new RegExp("'", "g"), "\\'"), "replace", new RegExp("\\\\\"", "g"), "\""), "'");
        return call_method($ctx, "stylize", $simple, "string");
      case "number":
        return call_method($ctx, "stylize", _concat("", $value), "number");
      case "boolean":
        return call_method($ctx, "stylize", _concat("", $value), "boolean");
    }
    if ($value === Object::$null) {
      return call_method($ctx, "stylize", "null", "null");
    }
  });
  $formatError = new Func("formatError", function($value = null) use (&$Error) {
    return _concat("[", call_method(get(get($Error, "prototype"), "toString"), "call", $value), "]");
  });
  $formatArray = new Func("formatArray", function($ctx = null, $value = null, $recurseTimes = null, $keys = null) use (&$Object, &$String, &$formatProperty) {
    $output = new Arr();
    for ($i = 0.0, $l = get($value, "length"); $i < $l; ++$i) {
      if (is(call_method(get(get($Object, "prototype"), "hasOwnProperty"), "call", $value, call($String, $i)))) {
        call_method($output, "push", call($formatProperty, $ctx, $value, $recurseTimes, $keys, call($String, $i), true));
      } else {
        call_method($output, "push", "");
      }

    }
    call_method($keys, "forEach", new Func(function($key = null) use (&$output, &$formatProperty, &$ctx, &$value, &$recurseTimes, &$keys) {
      if (not(call_method($key, "match", new RegExp("^\\d+\$", "")))) {
        call_method($output, "push", call($formatProperty, $ctx, $value, $recurseTimes, $keys, $key, true));
      }
    }));
    return $output;
  });
  $formatProperty = new Func("formatProperty", function($ctx = null, $value = null, $recurseTimes = null, $keys = null, $key = null, $array = null) use (&$formatValue, &$JSON) {
    $desc = new Object("value", get($value, $key));
    if (call_method($keys, "indexOf", $key) < 0.0) {
      $name = _concat("[", $key, "]");
    }
    if (call_method(get($ctx, "seen"), "indexOf", get($desc, "value")) < 0.0) {
      if ($recurseTimes === Object::$null) {
        $str = call($formatValue, $ctx, get($desc, "value"), Object::$null);
      } else {
        $str = call($formatValue, $ctx, get($desc, "value"), to_number($recurseTimes) - 1.0);
      }

      if (call_method($str, "indexOf", "\n") > -1.0) {
        if (is($array)) {
          $str = call_method(call_method(call_method(call_method($str, "split", "\n"), "map", new Func(function($line = null) {
            return _concat("  ", $line);
          })), "join", "\n"), "substr", 2.0);
        } else {
          $str = _concat("\n", call_method(call_method(call_method($str, "split", "\n"), "map", new Func(function($line = null) {
            return _concat("   ", $line);
          })), "join", "\n"));
        }

      }
    } else {
      $str = call_method($ctx, "stylize", "[Circular]", "special");
    }

    if (_typeof($name) === "undefined") {
      if (is($array) && is(call_method($key, "match", new RegExp("^\\d+\$", "")))) {
        return $str;
      }
      $name = call_method($JSON, "stringify", _concat("", $key));
      if (is(call_method($name, "match", new RegExp("^\"([a-zA-Z_][a-zA-Z_0-9]*)\"\$", "")))) {
        $name = call_method($name, "substr", 1.0, to_number(get($name, "length")) - 2.0);
        $name = call_method($ctx, "stylize", $name, "name");
      } else {
        $name = call_method(call_method(call_method($name, "replace", new RegExp("'", "g"), "\\'"), "replace", new RegExp("\\\\\"", "g"), "\""), "replace", new RegExp("(^\"|\"\$)", "g"), "'");
        $name = call_method($ctx, "stylize", $name, "string");
      }

    }
    return _concat($name, ": ", $str);
  });
  $reduceToSingleString = new Func("reduceToSingleString", function($output = null, $base = null, $braces = null) {
    $numLinesEst = 0.0;
    $length = 0.0;
    call_method($output, "forEach", new Func(function($str = null) use (&$numLinesEst, &$length) {
      $numLinesEst++;
      if (call_method($str, "indexOf", "\n") >= 0.0) {
        $numLinesEst++;
      }
      $length += _plus(get($str, "length"), 1.0);
    }));
    if ($length > 60.0) {
      return _concat(get($braces, 0.0), $base === "" ? "" : (_concat($base, "\n ")), " ", call_method($output, "join", ",\n  "), " ", get($braces, 1.0));
    }
    return _concat(get($braces, 0.0), $base, " ", call_method($output, "join", ", "), " ", get($braces, 1.0));
  });
  $isArray = new Func("isArray", function($ar = null) use (&$Array, &$objectToString) {
    return (is($or_ = call_method($Array, "isArray", $ar)) ? $or_ : _typeof($ar) === "object" && call($objectToString, $ar) === "[object Array]");
  });
  $isRegExp = new Func("isRegExp", function($re = null) use (&$objectToString) {
    return _typeof($re) === "object" && call($objectToString, $re) === "[object RegExp]";
  });
  $isDate = new Func("isDate", function($d = null) use (&$objectToString) {
    return _typeof($d) === "object" && call($objectToString, $d) === "[object Date]";
  });
  $isError = new Func("isError", function($e = null) use (&$objectToString) {
    return _typeof($e) === "object" && call($objectToString, $e) === "[object Error]";
  });
  $objectToString = new Func("objectToString", function($o = null) use (&$Object) {
    return call_method(get(get($Object, "prototype"), "toString"), "call", $o);
  });
  return $inspect;
});
