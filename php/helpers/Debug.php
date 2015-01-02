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

/*
//code below is generated from this:

var inspect = (function() {

  function inspect(obj, depth) {
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    };
    return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
  }


  function stylizeNoColor(str, styleType) {
    return str;
  }


  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value.inspect !== inspect &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }

    if (value && typeof value.valueOf == 'function') {
      value = value.valueOf();
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    if (typeof value === 'object' && !(value instanceof Object)) {
      //some object from another scope or a non-js type
      return ctx.stylize('[object Object]', 'special');
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (typeof value === 'function') {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '', array = false, braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length === 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, keys, keys);
    } else {
      output = keys.map(function(key) {
        return formatProperty(ctx, value, recurseTimes, keys, key, array);
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }


  function formatPrimitive(ctx, value) {
    switch (typeof value) {
      case 'undefined':
        return ctx.stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return ctx.stylize(simple, 'string');

      case 'number':
        return ctx.stylize('' + value, 'number');

      case 'boolean':
        return ctx.stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return ctx.stylize('null', 'null');
    }
  }


  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }


  function formatArray(ctx, value, recurseTimes, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (Object.prototype.hasOwnProperty.call(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, keys, String(i), true));
      } else {
        output.push('');
      }
    }
    keys.forEach(function(key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, keys, key, true));
      }
    });
    return output;
  }


  function formatProperty(ctx, value, recurseTimes, keys, key, array) {
    var desc = { value: value[key] };
    if (keys.indexOf(key) < 0) {
      var name = '[' + key + ']';
    }
    var str;
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
    if (typeof name === 'undefined') {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'")
                   .replace(/\\"/g, '"')
                   .replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }


  function reduceToSingleString(output, base, braces) {
    var numLinesEst = 0;
    var length = 0;
    output.forEach(function(str) {
      numLinesEst++;
      if (str.indexOf('\n') >= 0) numLinesEst++;
      length += str.length + 1;
    });

    if (length > 60) {
      return braces[0] +
             (base === '' ? '' : base + '\n ') +
             ' ' +
             output.join(',\n  ') +
             ' ' +
             braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }


  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray(ar) {
    return Array.isArray(ar) || (typeof ar === 'object' && objectToString(ar) === '[object Array]');
  }


  function isRegExp(re) {
    return typeof re === 'object' && objectToString(re) === '[object RegExp]';
  }


  function isDate(d) {
    return typeof d === 'object' && objectToString(d) === '[object Date]';
  }


  function isError(e) {
    return typeof e === 'object' && objectToString(e) === '[object Error]';
  }


  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  return inspect;

})();
*/

//this is generated from JS; loosely based on inspect module from Node.js
Debug::$inspect = call_user_func(function() use (&$Date, &$Object, &$RegExp, &$JSON, &$Error, &$String, &$Array) {
  $inspect = new Func("inspect", function($obj = null, $depth = null) use (&$stylizeNoColor, &$formatValue) {
    $ctx = new Object("seen", new Arr(), "stylize", $stylizeNoColor);
    return call($formatValue, $ctx, $obj, (isset($depth) ? _typeof($depth) : "undefined") === "undefined" ? 2.0 : $depth);
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
    if ((isset($value) ? _typeof($value) : "undefined") === "object" && !_instanceof($value, $Object)) {
      return call_method($ctx, "stylize", "[object Object]", "special");
    }
    $keys = call_method($Object, "keys", $value);
    if (get($keys, "length") === 0.0) {
      if ((isset($value) ? _typeof($value) : "undefined") === "function") {
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
    if ((isset($value) ? _typeof($value) : "undefined") === "function") {
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
    switch ((isset($value) ? _typeof($value) : "undefined")) {
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

    if ((isset($name) ? _typeof($name) : "undefined") === "undefined") {
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
    return (is($or_ = call_method($Array, "isArray", $ar)) ? $or_ : (isset($ar) ? _typeof($ar) : "undefined") === "object" && call($objectToString, $ar) === "[object Array]");
  });
  $isRegExp = new Func("isRegExp", function($re = null) use (&$objectToString) {
    return (isset($re) ? _typeof($re) : "undefined") === "object" && call($objectToString, $re) === "[object RegExp]";
  });
  $isDate = new Func("isDate", function($d = null) use (&$objectToString) {
    return (isset($d) ? _typeof($d) : "undefined") === "object" && call($objectToString, $d) === "[object Date]";
  });
  $isError = new Func("isError", function($e = null) use (&$objectToString) {
    return (isset($e) ? _typeof($e) : "undefined") === "object" && call($objectToString, $e) === "[object Error]";
  });
  $objectToString = new Func("objectToString", function($o = null) use (&$Object) {
    return call_method(get(get($Object, "prototype"), "toString"), "call", $o);
  });
  return $inspect;
});
