<?php

call(new Func(function() use (&$Object, &$exports) {
  $hasOwnProperty = null; $SCOPE_TYPES = null; $SUPER_GLOBALS = null; $ESC_CHARS = null;
  $toHex = new Func("toHex", function($code = null, $prefix = null) {
    $hex = null;
    $hex = call_method(call_method($code, "toString", 16.0), "toUpperCase");
    if (get($hex, "length") === 1.0) {
      $hex = _concat("0", $hex);
    }
    if (is($prefix)) {
      $hex = _plus($prefix, $hex);
    }
    return $hex;
  });
  $toOctet = new Func("toOctet", function($codePoint = null, $shift = null, $prefix = null) use (&$toHex) {
    return call($toHex, to_number($codePoint) >> to_number($shift) & (float)0x3f | (float)0x80, $prefix);
  });
  $encodeChar = new Func("encodeChar", function($ch = null, $prefix = null) use (&$toHex, &$toOctet) {
    $code = null; $result = null;
    $code = call_method($ch, "charCodeAt", 0.0);
    if (eq((to_number($code) & (float)0xffffff80), 0.0)) {
      return call($toHex, $code, $prefix);
    }
    $result = "";
    if (eq((to_number($code) & (float)0xfffff800), 0.0)) {
      $result = call($toHex, to_number($code) >> 6.0 & (float)0x1f | (float)0xc0, $prefix);
    } else if (eq((to_number($code) & (float)0xffff0000), 0.0)) {
      $result = call($toHex, to_number($code) >> 12.0 & (float)0x0f | (float)0xe0, $prefix);
      $result = _plus($result, call($toOctet, $code, 6.0, $prefix));
    } else if (eq((to_number($code) & (float)0xffe00000), 0.0)) {
      $result = call($toHex, to_number($code) >> 18.0 & (float)0x07 | (float)0xf0, $prefix);
      $result = _plus($result, call($toOctet, $code, 12.0, $prefix));
      $result = _plus($result, call($toOctet, $code, 6.0, $prefix));
    }


    $result = _plus($result, call($toHex, to_number($code) & (float)0x3f | (float)0x80, $prefix));
    return $result;
  });
  $encodeString = new Func("encodeString", function($string = null) use (&$ESC_CHARS, &$encodeChar) {
    $string = call_method($string, "replace", new RegExp("[\\\\\"\\\$\\x00-\\x1F\\u007F-\\uFFFF]", "g"), new Func(function($ch = null) use (&$ESC_CHARS, &$encodeChar) {
      return _in($ch, $ESC_CHARS) ? get($ESC_CHARS, $ch) : call($encodeChar, $ch, "\\x");
    }));
    return _concat("\"", $string, "\"");
  });
  $encodeVarName = new Func("encodeVarName", function($name = null, $suffix = null) use (&$SUPER_GLOBALS, &$hasOwnProperty, &$encodeChar) {
    $suffix = (is($or_ = $suffix) ? $or_ : "");
    if (not($suffix) && is(call_method($hasOwnProperty, "call", $SUPER_GLOBALS, $name))) {
      $suffix = "_";
    }
    if (not($suffix) && call_method($name, "slice", -1.0) === "_") {
      $suffix = "_";
    }
    $name = call_method($name, "replace", new RegExp("[^a-z0-9_]", "gi"), new Func(function($ch = null) use (&$encodeChar) {
      return _concat("\xC2\xAB", call_method(call($encodeChar, $ch), "toLowerCase"), "\xC2\xBB");
    }));
    if ($suffix === "" && $name === "__dirname") {
      return "__DIR__";
    }
    return _concat("\$", $name, $suffix);
  });
  $getParentScope = new Func("getParentScope", function($node = null) use (&$SCOPE_TYPES) {
    $parent = null;
    $parent = get($node, "parent");
    while (!_in(get($parent, "type"), $SCOPE_TYPES)) {
      $parent = get($parent, "parent");
    }
    return get($parent, "type") === "Program" ? $parent : get($parent, "body");
  });
  $hasOwnProperty = get(get($Object, "prototype"), "hasOwnProperty");
  $SCOPE_TYPES = new Obj("FunctionDeclaration", 1.0, "FunctionExpression", 1.0, "Program", 1.0);
  $SUPER_GLOBALS = new Obj("GLOBALS", 1.0, "_SERVER", 1.0, "_GET", 1.0, "_POST", 1.0, "_FILES", 1.0, "_COOKIE", 1.0, "_SESSION", 1.0, "_REQUEST", 1.0, "_ENV", 1.0);
  $ESC_CHARS = new Obj("\t", "\\t", "\n", "\\n", "\f", "\\f", "\r", "\\r", "\"", "\\\"", "\$", "\\\$", "\\", "\\\\");
  set($exports, "encodeString", $encodeString);
  set($exports, "encodeVarName", $encodeVarName);
  set($exports, "getParentScope", $getParentScope);
}));
