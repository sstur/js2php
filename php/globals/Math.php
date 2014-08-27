<?php
$Math = call_user_func(function() {
  $Math = new Object();

  //constants
  $Math->set('E', M_E);
  $Math->set('LN10', M_LN10);
  $Math->set('LN2', M_LN2);
  $Math->set('LOG10E', M_LOG10E);
  $Math->set('LOG2E', M_LOG2E);
  $Math->set('PI', M_PI);
  $Math->set('SQRT1_2', M_SQRT1_2);
  $Math->set('SQRT2', M_SQRT2);

  //private vars
  $randMax = mt_getrandmax();

  //Math.random()
  $Math->set('random', new Func(function($this_) use (&$randMax) {
    return (float)(mt_rand() / ($randMax + 1));
  }));

  //Math.round()
  $Math->set('round', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return (float)round($num);
  }));

  //Math.ceil()
  $Math->set('ceil', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return (float)ceil($num);
  }));

  //Math.floor()
  $Math->set('floor', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return (float)floor($num);
  }));

  //Math.abs()
  $Math->set('abs', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return (float)abs($num);
  }));

  //Math.max()
  $Math->set('max', new Func(function($this_, $arguments) {
    $args = $arguments->args;
    $len = count($args);
    $max = -INF;
    for ($i = 0; $i < $len; $i++) {
      $num = to_number($args[$i]);
      if ($num === NaN::$nan) return NaN::$nan;
      if ($num > $max) $max = $num;
    }
    return (float)$max;
  }));

  //Math.min()
  $Math->set('min', new Func(function($this_, $arguments) {
    $args = $arguments->args;
    $len = count($args);
    $min = INF;
    for ($i = 0; $i < $len; $i++) {
      $num = to_number($args[$i]);
      if ($num === NaN::$nan) return NaN::$nan;
      if ($num < $min) $min = $num;
    }
    return (float)$min;
  }));

  //Math.pow()
  $Math->set('pow', new Func(function($this_, $arguments, $num, $exp) {
    $num = to_number($num);
    $exp = to_number($exp);
    if ($num === NaN::$nan || $exp === NaN::$nan) {
      return NaN::$nan;
    }
    return catch_nan(pow($num, $exp));
  }));

  //Math.log()
  $Math->set('log', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(log($num));
  }));

  //Math.exp()
  $Math->set('exp', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(exp($num));
  }));

  //Math.sqrt()
  $Math->set('sqrt', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(sqrt($num));
  }));

  //Math.sin()
  $Math->set('sin', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(sin($num));
  }));

  //Math.cos()
  $Math->set('cos', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(cos($num));
  }));

  //Math.tan()
  $Math->set('tan', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(tan($num));
  }));

  //Math.atan()
  $Math->set('atan', new Func(function($this_, $arguments, $num) {
    $num = to_number($num);
    if ($num === NaN::$nan) return NaN::$nan;
    return catch_nan(atan($num));
  }));

  //Math.atan2()
  $Math->set('atan2', new Func(function($this_, $arguments, $y, $x) {
    $y = to_number($y);
    $x = to_number($x);
    if ($y === NaN::$nan || $x === NaN::$nan) {
      return NaN::$nan;
    }
    return catch_nan(atan2($y, $x));
  }));

  return $Math;
});
