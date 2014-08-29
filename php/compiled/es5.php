<?php
set(get($Array, "prototype"), "forEach", new Func("forEach", function($this_, $arguments, $fn) {
  $obj = null; $ctx = null; $length = null; $i = null;
  $obj = $this_;
  $ctx = get($arguments, 1.0);
  $length = get($obj, "length");
  $i = -1.0;
  while (++$i < $length) {
    if (js_in($i, $obj)) {
      call_method($fn, "call", $ctx, get($obj, $i), $i, $obj);
    }
  }
}));
