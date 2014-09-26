<?php
class RegExp extends Object {
  public $className = "[object RegExp]";

  public $source = '';
  public $ignoreCaseFlag = false;
  public $globalFlag = false;
  public $multilineFlag = false;

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
    $flags = array_key_exists('1', $args) ? to_string($args[1]) : '';
    $this->ignoreCaseFlag = (strpos($flags, 'i') !== false);
    $this->globalFlag = (strpos($flags, 'g') !== false);
    $this->multilineFlag = (strpos($flags, 'm') !== false);
  }

  function get_source() {
    return $this->source;
  }

  function set_source($value) {
    return $value;
  }

  function get_ignoreCase() {
    return $this->ignoreCaseFlag;
  }

  function set_ignoreCase($value) {
    return $value;
  }

  function get_global() {
    return $this->globalFlag;
  }

  function set_global($value) {
    return $value;
  }

  function get_multiline() {
    return $this->multilineFlag;
  }

  function set_multiline($value) {
    return $value;
  }

  /**
   * @param bool $pcre - whether to write pcre format. pcre does not allow /g
   *  flag but does support the non-standard /u flag for utf8
   * @return string
   */
  function toString($pcre = true) {
    $source = $this->source;
    $flags = '';
    if ($this->ignoreCaseFlag) {
      $flags .= 'i';
    }
    //pcre doesn't support the global flag, so by default we don't write this
    if (!$pcre && $this->globalFlag) {
      $flags .= 'g';
    }
    //pcre will interpret the regex and the subject as utf8 with this flag
    if ($pcre) {
      $flags .= 'u';
    }
    if ($this->multilineFlag) {
      $flags .= 'm';
    }
    return '/' . str_replace('/', '\\/', $source) . '/' . $flags;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $RegExp = new Func(function($this_, $arguments) {
      $reg = new RegExp();
      $reg->init($arguments->args);
      return $reg;
    });
    $RegExp->set('prototype', RegExp::$protoObject);
    $RegExp->setMethods(RegExp::$classMethods, true, false, true);
    return $RegExp;
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
      return $this_->toString(false);
    }
);

RegExp::$protoObject = new Object();
RegExp::$protoObject->setMethods(RegExp::$protoMethods, true, false, true);
