<?php
call(new Func(function($this_, $arguments) use (&$Array, &$Error, &$Object, &$String, &$Function) {
  $toObject = null;
  $toObject = new Func("toObject", function($this_, $arguments, $o) use (&$Error, &$Object) {
    if ($o == Null::$null) {
      throw new Ex(x_new($Error, x_plus(x_plus("can't convert ", $o), " to object")));
    }
    return call($Object, $o);
  });
  set(get($Array, "prototype"), "map", new Func("map", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Array, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $result = call($Array, $length);
    $context = get($arguments, 1.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_in($i, $self)) {
        set($result, $i, call_method($fn, "call", $context, get($self, $i), $i, $object));
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "filter", new Func("filter", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $result = new Arr();
    $context = get($arguments, 1.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_in($i, $self)) {
        $value = get($self, $i);
        if (call_method($fn, "call", $context, $value, $i, $object)) {
          call_method($result, "push", $value);
        }
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "every", new Func("every", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $context = get($arguments, 1.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_and(x_in($i, $self), !call_method($fn, "call", $context, get($self, $i), $i, $object))) {
        return false;
      }
    }
    return true;
  }));
  set(get($Array, "prototype"), "some", new Func("some", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $context = get($arguments, 1.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_and(x_in($i, $self), call_method($fn, "call", $context, get($self, $i), $i, $object))) {
        return true;
      }
    }
    return false;
  }));
  set(get($Array, "prototype"), "reduce", new Func("reduce", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    if (x_and(!$length, (get($arguments, "length") == 1.0))) {
      throw new Ex(x_new($Error, "reduce of empty array with no initial value"));
    }
    $i = 0.0;
    if (get($arguments, "length") >= 2.0) {
      $result = get($arguments, 1.0);
    } else {
      do {
        if (x_in($i, $self)) {
          $result = get($self, $i++);
          break;
        }
        if (++$i >= $length) {
          throw new Ex(x_new($Error, "reduce of empty array with no initial value"));
        }
      } while (true);
    }

    for (; $i < $length; $i++) {
      if (x_in($i, $self)) {
        $result = call_method($fn, "call", x_void(0.0), $result, get($self, $i), $i, $object);
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "reduceRight", new Func("reduceRight", function($this_, $arguments, $fn) use (&$toObject, &$String, &$Function, &$Error) {
    $object = call($toObject, $this_);
    $self = x_instanceof($this_, $String) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    if (!x_instanceof($fn, $Function)) {
      throw new Ex(x_new($Error, x_plus($fn, " is not a function")));
    }
    if (x_and(!$length, (get($arguments, "length") == 1.0))) {
      throw new Ex(x_new($Error, "reduceRight of empty array with no initial value"));
    }
    $i = $length - 1.0;
    if (get($arguments, "length") >= 2.0) {
      $result = get($arguments, 1.0);
    } else {
      do {
        if (x_in($i, $self)) {
          $result = get($self, $i--);
          break;
        }
        if (--$i < 0.0) {
          throw new Ex(x_new($Error, "reduceRight of empty array with no initial value"));
        }
      } while (true);
    }

    do {
      if (x_in($i, $this_)) {
        $result = call_method($fn, "call", x_void(0.0), $result, get($self, $i), $i, $object);
      }
    } while ($i--);
    return $result;
  }));
}));

