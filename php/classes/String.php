<?php
class Str extends Object {
  public $className = "[object String]";
  public $value = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct($str = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->value = $str;
      $this->length = mb_strlen($str);
    }
  }

  function get_length() {
    return (float)$this->length;
  }

  function set_length($len) {
    return $len;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $String = new Func(function($this_, $arguments, $value) {
      if ($this_ instanceof Str) {
        $this_->value = to_string($value);
        return $this_;
      } else {
        return to_string($value);
      }
    });
    $String->instantiate = function() {
      return new Str();
    };
    $String->set('prototype', RegExp::$protoObject);
    $String->setMethods(Str::$classMethods, true, false, true);
    return $String;
  }
}

Str::$classMethods = array(
  'fromCharCode' => function($this_, $arguments, $code) {
      return chr($code);
    }
);

Str::$protoMethods = array(
  'charAt' => function($this_, $arguments, $i) {
      $ch = mb_substr($this_->value, $i, 1);
      return ($ch === false) ? '' : $ch;
    },
  'charCodeAt' => function($this_, $arguments, $i) {
      $ch = mb_substr($this_->value, $i, 1);
      if ($ch === false) return NaN::$nan;
      $len = strlen($ch);
      if ($len === 1) {
        $code = ord($ch[0]);
      } else {
        $ch = mb_convert_encoding($ch, 'UCS-2LE', 'UTF-8');
        $code = ord($ch[1]) * 256 + ord($ch[0]);
      }
      return (float)$code;
    },
  'indexOf' => function($this_, $arguments, $search, $offset = 0) {
      return (float)mb_strpos($this_->value, $search, $offset);
    },
  'split' => function($this_, $arguments, $delim) {
      $str = $this_->value;
      if ($delim instanceof RegExp) {
        $arr = mb_split($delim->toString(), $str);
      } else {
        $delim = to_string($delim);
        if ($delim === '') {
          $len = mb_strlen($str);
          $arr = array();
          for ($i = 0; $i < $len; $i++) {
            $arr[] = mb_substr($str, $i, 1);
          }
        } else {
          $arr = explode($delim, $str);
        }
      }
      $result = new Arr();
      $result->init($arr);
      return $result;
    },
  'substr' => function($this_, $arguments, $start, $num = null) {
      $len = $this_->length;
      if ($len === 0) {
        return '';
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return '';
      }
      if ($num === null) {
        return mb_substr($this_->value, $start);
      } else {
        return mb_substr($this_->value, $start, $num);
      }
    },
  'substring' => function($this_, $arguments, $start, $end = null) {
      $len = $this_->length;
      //if second param is absent
      if ($arguments->length === 1) {
        $end = $len;
      }
      $start = (int)$start;
      $end = (int)$end;
      if ($start < 0) $start = 0;
      if ($start > $len) $start = $len;
      if ($end < 0) $end = 0;
      if ($end > $len) $end = $len;
      if ($start === $end) {
        return '';
      }
      if ($end < $start) {
        list($start, $end) = array($end, $start);
      }
      return mb_substr($this_->value, $start, $end - $start);
    },
  'slice' => function($this_, $arguments, $start, $end = null) {
      $len = $this_->length;
      if ($len === 0) {
        return '';
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return '';
      }
      $end = ($end === null) ? $len : (int)$end;
      if ($end < 0) {
        $end = $len + $end;
      }
      if ($end < $start) {
        $end = $start;
      }
      if ($end > $len) {
        $end = $len;
      }
      return mb_substr($this_->value, $start, $end - $start);
    },
  'trim' => function($this_, $arguments) {
      return trim($this_->value);
    },
  'replace' => function($this_, $arguments, $search, $replace) {
      $original = $this_->value;
      $isRegEx = ($search instanceof RegExp);
      $limit = ($isRegEx && $search->globalFlag) ? -1 : 1;
      $search = $isRegEx ? $search->toString() : to_string($search);
      if ($replace instanceof Func) {
        $replacer = function($matches) use (&$replace, &$original) {
          //todo: offset
          $offset = 0;
          array_push($matches, $offset);
          array_push($matches, $original);
          return to_string($replace->apply(null, $matches));
        };
        if ($isRegEx) {
          return preg_replace_callback($search, $replacer, $original, $limit);
        } else {
          //callback gets: $search, $index, $this_-value
          throw new Ex(Error::create('Not implemented: String.prototype.replace(<string>, <function>)'));
          //return str_replace_callback($search, $replacer, $original);
        }
      }
      $replace = to_string($replace);
      if ($isRegEx) {
        return preg_replace($search, $replace, $original, $limit);
      } else {
        $parts = explode($search, $original);
        $first = array_shift($parts);
        return $first . $replace . implode($search, $parts);
      }
    },
  'localeCompare' => function($this_, $arguments, $compareTo) {
      return (float)strcmp($this_->value, to_string($compareTo));
    },
  'valueOf' => function($this_) {
      return $this_->value;
    },
  'toString' => function($this_) {
      return $this_->value;
    }
);

Str::$protoObject = new Object();
Str::$protoObject->setMethods(Str::$protoMethods, true, false, true);
