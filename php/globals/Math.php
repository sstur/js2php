<?php
$Math = call_user_func(function() {
  $randMax = mt_getrandmax();

  $methods = array(
    'random' => function($this_) use (&$randMax) {
        return (float)(mt_rand() / ($randMax + 1));
      },

    'round' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return (float)round($num);
      },

    'ceil' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return (float)ceil($num);
      },

    'floor' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return (float)floor($num);
      },

    'abs' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return (float)abs($num);
      },

    'max' => function($this_, $arguments) {
        $args = $arguments->args;
        $len = count($args);
        $max = -INF;
        for ($i = 0; $i < $len; $i++) {
          $num = to_number($args[$i]);
          if ($num === NaN::$nan) return NaN::$nan;
          if ($num > $max) $max = $num;
        }
        return (float)$max;
      },

    'min' => function($this_, $arguments) {
        $args = $arguments->args;
        $len = count($args);
        $min = INF;
        for ($i = 0; $i < $len; $i++) {
          $num = to_number($args[$i]);
          if ($num === NaN::$nan) return NaN::$nan;
          if ($num < $min) $min = $num;
        }
        return (float)$min;
      },

    'pow' => function($this_, $arguments, $num, $exp) {
        $num = to_number($num);
        $exp = to_number($exp);
        if ($num === NaN::$nan || $exp === NaN::$nan) {
          return NaN::$nan;
        }
        return catch_nan(pow($num, $exp));
      },

    'log' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(log($num));
      },

    'exp' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(exp($num));
      },

    'sqrt' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(sqrt($num));
      },

    'sin' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(sin($num));
      },

    'cos' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(cos($num));
      },

    'tan' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(tan($num));
      },

    'atan' => function($this_, $arguments, $num) {
        $num = to_number($num);
        if ($num === NaN::$nan) return NaN::$nan;
        return catch_nan(atan($num));
      },

    'atan2' => function($this_, $arguments, $y, $x) {
        $y = to_number($y);
        $x = to_number($x);
        if ($y === NaN::$nan || $x === NaN::$nan) {
          return NaN::$nan;
        }
        return catch_nan(atan2($y, $x));
      }
  );

  $constants = array(
    'E' => M_E,
    'LN10' => M_LN10,
    'LN2' => M_LN2,
    'LOG10E' => M_LOG10E,
    'LOG2E' => M_LOG2E,
    'PI' => M_PI,
    'SQRT1_2' => M_SQRT1_2,
    'SQRT2' => M_SQRT2
  );

  $Math = new Object();
  $Math->setMethods($methods, true, false, true);
  $Math->setProps($constants, true, false, true);

  return $Math;
});
