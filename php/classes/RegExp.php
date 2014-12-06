<?php
class RegExp extends Object {
  public $className = "RegExp";

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
   * Note: JS RegExp has different character classes than PCRE. For instance
   *   in JS `\w` is [ \f\n\r\t\v​\xA0] (and a bunch of unicode spaces) but
   *   in PCRE it's only [ \f\n\r\t]
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
    //pcre doesn't support the global flag
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
   * Format replacement string for preg_replace
   * @param string $str
   * @return string
   */
  static function toReplacementString($str) {
    $str = str_replace('\\', '\\\\', $str);
    $str = str_replace('$&', '$0', $str);
    return $str;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $RegExp = new Func(function() {
      $reg = new RegExp();
      $reg->init(func_get_args());
      return $reg;
    });
    $RegExp->set('prototype', RegExp::$protoObject);
    $RegExp->setMethods(RegExp::$classMethods, true, false, true);
    return $RegExp;
  }
}

RegExp::$classMethods = array();

RegExp::$protoMethods = array(
  'exec' => function($str) {
      $self = Func::getContext();
      $str = to_string($str);
      //todo $offset
      $offset = 0;
      $result = preg_match($self->toString(true), $str, $matches, PREG_OFFSET_CAPTURE, $offset);
      if ($result === false) {
        throw new Ex(Error::create('Error executing Regular Expression: ' . $self->toString()));
      }
      if ($result === 0) {
        return Object::$null;
      }
      $index = $matches[0][1];
      $self->set('lastIndex', (float)($index + strlen($matches[0][0])));
      $arr = new Arr();
      foreach ($matches as $match) {
        $arr->push($match[0]);
      }
      $arr->set('index', (float)$index);
      $arr->set('input', $str);
      return $arr;
    },
  'test' => function($str) {
      $self = Func::getContext();
      $result = preg_match($self->toString(true), to_string($str));
      return ($result !== false);
    },
  'toString' => function() {
      $self = Func::getContext();
      return $self->toString(false);
    }
);

RegExp::$protoObject = new Object();
RegExp::$protoObject->setMethods(RegExp::$protoMethods, true, false, true);
