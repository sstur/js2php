<?php
class RegExp extends Object implements JsonSerializable {
  public $className = "[object RegExp]";

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    $args = func_get_args();
    if (count($args) > 0) {
      $this->init($args);
    }
  }

  function init($args) {
    $this->source = ($args[0] === null) ? '(?:)' : to_string($args[0]);
    $flags = ($args[1] === null) ? '' : to_string($args[1]);
    $this->ignoreCase = (strpos($flags, 'i') !== false);
    $this->global = (strpos($flags, 'g') !== false);
    $this->multiline = (strpos($flags, 'm') !== false);
  }

  static function initProtoObject() {
    self::$protoObject = new Object();
    self::$protoObject->setMethods(RegExp::$protoMethods, true, false, true);
  }

  function get_source() {
    return $this->source;
  }

  function set_source($value) {
    return $value;
  }

  function get_ignoreCase() {
    return $this->ignoreCase;
  }

  function set_ignoreCase($value) {
    return $value;
  }

  function get_global() {
    return $this->global;
  }

  function set_global($value) {
    return $value;
  }

  function get_multiline() {
    return $this->multiline;
  }

  function set_multiline($value) {
    return $value;
  }

  function jsonSerialize() {
    return new StdClass();
  }
}

RegExp::$classMethods = array();

RegExp::$protoMethods = array(
  'exec' => function($this_, $arguments, $str) {
      $str = to_string($str);
      $result = preg_match($this_->callMethod('toString'), $str, $matches);
      if ($result === false) {
        return Null::$null;
      }
      $this_->set('lastIndex', (float)($result + strlen($matches[0])));
      $arr = new Arr();
      $arr->init($matches);
      $arr->set('index', (float)$result);
      $arr->set('input', $str);
      return $arr;
    },
  'test' => function($this_, $arguments, $str) {
      $result = preg_match($this_->callMethod('toString'), to_string($str));
      return ($result !== false);
    },
  'toString' => function($this_) {
      $source = $this_->get('source');
      $flags = '';
      if ($this_->get('ignoreCase')) $flags .= 'i';
      if ($this_->get('global')) $flags .= 'g';
      if ($this_->get('multiline')) $flags .= 'm';
      return '/' . str_replace('/', '\\/', $source) . '/' . $flags;
    }
);

RegExp::initProtoObject();
