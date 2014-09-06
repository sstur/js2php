<?php
class Ex extends Exception {
  public $value = null;

  function __construct($value) {
    $this->value = $value;
  }

}
