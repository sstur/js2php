<?php
$global = Object::$global = new GlobalObject();
$undefined = null;
$Infinity = INF;
$NaN = NaN::$nan;

$Object = new Func(function($this_, $arguments, $value = null) {
  if ($arguments->length === 0) {
    return new Object();
  } else if ($value === null || $value === Null::$null) {
    return new Object();
  } else {
    return objectify($value);
  }
});
$Object->set('prototype', Object::$protoObject);
$Object->setMethods(Object::$classMethods, true, false, true);

$Function = new Func(function($this_, $arguments, $fn) {
  throw new Ex(Error::create('Cannot construct function at runtime.'));
});
$Function->set('prototype', Func::$protoObject);
$Function->setMethods(Func::$classMethods, true, false, true);

$Array = new Func(function($this_, $arguments, $value = null) {
  $arr = new Arr();
  $len = $arguments->length;
  if ($len === 1 && is_int_or_float($value)) {
    $arr->set('length', (float)$value);
  } else if ($len > 1) {
    $arr->init($arguments->args);
  }
  return $arr;
});
$Array->set('prototype', Arr::$protoObject);
$Array->setMethods(Arr::$classMethods, true, false, true);

$Boolean = new Func(function($this_, $arguments, $value) {
  if ($this_ instanceof Bln) {
    $this_->value = $value ? true : false;
    return $this_;
  } else {
    return $value ? true : false;
  }
});
$Boolean->instantiate = function() {
  return new Bln();
};
$Boolean->set('prototype', Bln::$protoObject);
$Boolean->setMethods(Bln::$classMethods, true, false, true);

$Number = new Func(function($this_, $arguments, $value) {
  if ($this_ instanceof Number) {
    $this_->value = to_number($value);
    return $this_;
  } else {
    return to_number($value);
  }
});
$Number->instantiate = function() {
  return new Number();
};
$Number->set('prototype', Number::$protoObject);
$Number->setMethods(Number::$classMethods, true, false, true);

$String = new Func(function($this_, $arguments, $value) {
  if ($this_ instanceof Str) {
    $this_->value = to_string($value);
    return $this_;
  } else {
    return to_string($value);
  }
});
$String->instantiate = function() {
  return new Str();
};
$String->set('prototype', RegExp::$protoObject);
$String->setMethods(Str::$classMethods, true, false, true);

$Date = new Func(function($this_, $arguments) {
  $date = new Date();
  $date->init($arguments->args);
  return $date;
});
$Date->set('prototype', Date::$protoObject);
$Date->setMethods(Date::$classMethods, true, false, true);

$Error = new Func(function($this_, $arguments, $str = null) {
  return new Error($str);
});
$Error->set('prototype', Error::$protoObject);
$Error->setMethods(Error::$classMethods, true, false, true);

$RegExp = new Func(function($this_, $arguments) {
  $reg = new RegExp();
  $reg->init($arguments->args);
  return $reg;
});
$RegExp->set('prototype', RegExp::$protoObject);
$RegExp->setMethods(RegExp::$classMethods, true, false, true);

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

$parseInt = $Number->get('parseInt');

$parseFloat = $Number->get('parseFloat');
