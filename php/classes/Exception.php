<?php
class Ex extends Exception {
  public $value = null;

  function __construct($value) {
    $this->value = $value;
  }

  //todo: if we use __toString we need to render our own stack trace

  //function __toString() {
  //  if ($this->value instanceof Error) {
  //    return $this->value->get('message');
  //  } else {
  //    return to_string($this->value);
  //  }
  //}

}
