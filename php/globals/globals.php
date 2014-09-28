<?php
$global = Object::$global;
$undefined = null;
$Infinity = INF;
$NaN = NaN::$nan;

$Object = Object::getGlobalConstructor();
$Function = Func::getGlobalConstructor();
$Array = Arr::getGlobalConstructor();
$Boolean = Bln::getGlobalConstructor();
$Number = Number::getGlobalConstructor();
$String = Str::getGlobalConstructor();
$Date = Date::getGlobalConstructor();
$Error = Error::getGlobalConstructor();
$RangeError = RangeError::getGlobalConstructor();
$ReferenceError = ReferenceError::getGlobalConstructor();
$SyntaxError = SyntaxError::getGlobalConstructor();
$TypeError = TypeError::getGlobalConstructor();
$RegExp = RegExp::getGlobalConstructor();
$Buffer = Buffer::getGlobalConstructor();

$escape = call_user_func(function() {
  $list = array('%2A' => '*', '%2B' => '+', '%2F' => '/', '%40' => '@');
  return new Func(function($global, $arguments, $str) use (&$list) {
    $result = rawurlencode($str);
    foreach ($list as $pct => $ch) {
      $result = str_replace($pct, $ch, $result);
    }
    return $result;
  });
});

$unescape = new Func(function($global, $arguments, $str) {
  $str = str_replace('+', '%2B', $str);
  return urldecode($str);
});

$encodeURI = call_user_func(function() {
  $list = array('%21' => '!', '%27' => '\'', '%28' => '(', '%29' => ')', '%2A' => '*', '%7E' => '~');
  return new Func(function($global, $arguments, $str) use (&$list) {
    $result = rawurlencode($str);
    foreach ($list as $pct => $ch) {
      $result = str_replace($pct, $ch, $result);
    }
    return $result;
  });
});

$decodeURI = new Func(function($global, $arguments, $str) {
  $str = str_replace('+', '%2B', $str);
  return urldecode($str);
});

$encodeURIComponent = call_user_func(function() {
  $list = array('%21' => '!', '%23' => '#', '%24' => '$', '%26' => '&', '%27' => '\'', '%28' => '(', '%29' => ')', '%2A' => '*', '%2B' => '+', '%2C' => ',', '%2F' => '/', '%3A' => ':', '%3B' => ';', '%3D' => '=', '%3F' => '?', '%40' => '@', '%7E' => '~');
  return new Func(function($global, $arguments, $str) use (&$list) {
    $result = rawurlencode($str);
    foreach ($list as $pct => $ch) {
      $result = str_replace($pct, $ch, $result);
    }
    return $result;
  });
});

$decodeURIComponent = new Func(function($global, $arguments, $str) {
  $str = str_replace('+', '%2B', $str);
  return urldecode($str);
});

$isNaN = new Func(function($global, $arguments, $value) {
  return (to_number($value) === NaN::$nan);
});

$isFinite = $Number->get('isFinite');

$parseInt = $Number->get('parseInt');

$parseFloat = $Number->get('parseFloat');
