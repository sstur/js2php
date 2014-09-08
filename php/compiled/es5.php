<?php
call(new Func(function($this_, $arguments) use (&$Function, &$Array, &$Object, &$Error) {
  $slice = null; $_toString = null; $splitString = null; $toObject = null;
  set(get($Function, "prototype"), "bind", new Func("bind", function($this_, $arguments, $that) use (&$Error, &$slice, &$Object) {
    $target = null; $args = null; $bound = null;
    $target = $this_;
    if (x_typeof($target) != "function") {
      throw new Ex(x_new($Error, x_plus("Function.prototype.bind called on incompatible ", $target)));
    }
    $args = call_method($slice, "call", $arguments, 1.0);
    $bound = new Func(function($this_, $arguments) use (&$bound, &$target, &$args, &$slice, &$Object, &$that) {
      if (x_instanceof($this_, $bound)) {
        $result = call_method($target, "apply", $this_, call_method($args, "concat", call_method($slice, "call", $arguments)));
        if (call($Object, $result) === $result) {
          return $result;
        }
        return $this_;
      } else {
        return call_method($target, "apply", $that, call_method($args, "concat", call_method($slice, "call", $arguments)));
      }

    });
    if (get($target, "prototype")) {
      set($bound, "prototype", call_method($Object, "create", get($target, "prototype")));
    }
    return $bound;
  }));
  $call = get(get($Function, "prototype"), "call");
  $prototypeOfArray = get($Array, "prototype");
  $prototypeOfObject = get($Object, "prototype");
  $slice = get($prototypeOfArray, "slice");
  $_toString = call_method($call, "bind", get($prototypeOfObject, "toString"));
  $boxedString = call($Object, "a");
  $splitString = x_or((get($boxedString, 0.0) != "a"), !x_in(0.0, $boxedString));
  set(get($Array, "prototype"), "forEach", new Func("forEach", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $thisp = get($arguments, 1.0);
    $i = x_negate(1.0);
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error));
    }
    while (++$i < $length) {
      if (x_in($i, $self)) {
        call_method($fun, "call", $thisp, get($self, $i), $i, $object);
      }
    }
  }));
  set(get($Array, "prototype"), "map", new Func("map", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Array, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $result = call($Array, $length);
    $thisp = get($arguments, 1.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_in($i, $self)) {
        set($result, $i, call_method($fun, "call", $thisp, get($self, $i), $i, $object));
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "filter", new Func("filter", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $result = new Arr();
    $thisp = get($arguments, 1.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_in($i, $self)) {
        $value = get($self, $i);
        if (call_method($fun, "call", $thisp, $value, $i, $object)) {
          call_method($result, "push", $value);
        }
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "every", new Func("every", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $thisp = get($arguments, 1.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_and(x_in($i, $self), !call_method($fun, "call", $thisp, get($self, $i), $i, $object))) {
        return false;
      }
    }
    return true;
  }));
  set(get($Array, "prototype"), "some", new Func("some", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    $thisp = get($arguments, 1.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
    }
    for ($i = 0.0; $i < $length; $i++) {
      if (x_and(x_in($i, $self), call_method($fun, "call", $thisp, get($self, $i), $i, $object))) {
        return true;
      }
    }
    return false;
  }));
  set(get($Array, "prototype"), "reduce", new Func("reduce", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
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
        $result = call_method($fun, "call", x_void(0.0), $result, get($self, $i), $i, $object);
      }
    }
    return $result;
  }));
  set(get($Array, "prototype"), "reduceRight", new Func("reduceRight", function($this_, $arguments, $fun) use (&$toObject, &$splitString, &$_toString, &$Error) {
    $object = call($toObject, $this_);
    $self = x_and($splitString, (call($_toString, $this_) == "[object String]")) ? call_method($this_, "split", "") : $object;
    $length = x_bitwise_zfrs(get($self, "length"), 0.0);
    if (call($_toString, $fun) != "[object Function]") {
      throw new Ex(x_new($Error, x_plus($fun, " is not a function")));
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
        $result = call_method($fun, "call", x_void(0.0), $result, get($self, $i), $i, $object);
      }
    } while ($i--);
    return $result;
  }));
  $toObject = new Func(function($this_, $arguments, $o) use (&$Error, &$Object) {
    if ($o == Null::$null) {
      throw new Ex(x_new($Error, x_plus(x_plus("can't convert ", $o), " to object")));
    }
    return call($Object, $o);
  });
}));
