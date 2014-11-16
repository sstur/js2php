<?php
$Math = call_user_func(function() {
  $randMax = mt_getrandmax();

  $methods = array(
    'random' => function() use (&$randMax) {
        return (float)(mt_rand() / ($randMax + 1));
      },

    'round' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)round($num);
      },

    'ceil' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)ceil($num);
      },

    'floor' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)floor($num);
      },

    'abs' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)abs($num);
      },

    'max' => function() {
        $max = -INF;
        foreach (func_get_args() as $num) {
          $num = to_number($num);
          if (is_nan($num)) return NAN;
          if ($num > $max) $max = $num;
        }
        return (float)$max;
      },

    'min' => function() {
        $min = INF;
        foreach (func_get_args() as $num) {
          $num = to_number($num);
          if (is_nan($num)) return NAN;
          if ($num < $min) $min = $num;
        }
        return (float)$min;
      },

    'pow' => function($num, $exp) {
        $num = to_number($num);
        $exp = to_number($exp);
        if (is_nan($num) || is_nan($exp)) {
          return NAN;
        }
        return (float)pow($num, $exp);
      },

    'log' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)log($num);
      },

    'exp' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)exp($num);
      },

    'sqrt' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)sqrt($num);
      },

    'sin' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)sin($num);
      },

    'cos' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)cos($num);
      },

    'tan' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)tan($num);
      },

    'atan' => function($num) {
        $num = to_number($num);
        return is_nan($num) ? NAN : (float)atan($num);
      },

    'atan2' => function($y, $x) {
        $y = to_number($y);
        $x = to_number($x);
        if (is_nan($y) || is_nan($x)) {
          return NAN;
        }
        return (float)atan2($y, $x);
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
