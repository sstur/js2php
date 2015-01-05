<?php
class Str extends Object {
  public $className = "String";
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

  //allow subscript access to characters: `string[1]`
  function get($key) {
    if (is_float($key)) {
      if ((float)(int)$key === $key && $key >= 0) {
        return $this->callMethod('charAt', $key);
      }
    }
    return parent::get($key);
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $String = new Func(function($value = '') {
      $self = Func::getContext();
      if ($self instanceof Str) {
        $self->value = to_string($value);
        return $self;
      } else {
        return to_string($value);
      }
    });
    $String->instantiate = function() {
      return new Str();
    };
    $String->set('prototype', Str::$protoObject);
    $String->setMethods(Str::$classMethods, true, false, true);
    return $String;
  }
}

Str::$classMethods = array(
  'fromCharCode' => function($code) {
      return chr($code);
    }
);

Str::$protoMethods = array(
  'charAt' => function($i) {
      $self = Func::getContext();
      $ch = mb_substr($self->value, $i, 1);
      return ($ch === false) ? '' : $ch;
    },
  'charCodeAt' => function($i) {
      $self = Func::getContext();
      $ch = mb_substr($self->value, $i, 1);
      if ($ch === false) return NAN;
      $len = strlen($ch);
      if ($len === 1) {
        $code = ord($ch[0]);
      } else {
        $ch = mb_convert_encoding($ch, 'UCS-2LE', 'UTF-8');
        $code = ord($ch[1]) * 256 + ord($ch[0]);
      }
      return (float)$code;
    },
  'indexOf' => function($search, $offset = 0) {
      $self = Func::getContext();
      $index = mb_strpos($self->value, $search, $offset);
      return ($index === false) ? -1.0 : (float)$index;
    },
  'lastIndexOf' => function($search, $offset = null) {
      $self = Func::getContext();
      $str = $self->value;
      if ($offset !== null) {
        $offset = to_number($offset);
        if ($offset > 0 && $offset < $self->length) {
          $str = mb_substr($str, 0, $offset + 1);
        }
      }
      $index = mb_strrpos($str, $search);
      return ($index === false) ? -1.0 : (float)$index;
    },
  'split' => function($delim) {
      $self = Func::getContext();
      $str = $self->value;
      if ($delim instanceof RegExp) {
        //$arr = mb_split($delim->source, $str);
        $arr = preg_split($delim->toString(true), $str);
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
      return Arr::fromArray($arr);
    },
  'substr' => function($start, $num = null) {
      $self = Func::getContext();
      $len = $self->length;
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
        return mb_substr($self->value, $start);
      } else {
        return mb_substr($self->value, $start, $num);
      }
    },
  'substring' => function($start, $end = null) {
      $self = Func::getContext();
      $len = $self->length;
      //if second param is absent
      if (func_num_args() === 1) {
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
      return mb_substr($self->value, $start, $end - $start);
    },
  'slice' => function($start, $end = null) {
      $self = Func::getContext();
      $len = $self->length;
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
      return mb_substr($self->value, $start, $end - $start);
    },
  'trim' => function() {
      $self = Func::getContext();
      //todo: unicode [\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000]
      //note: trim doesn't work here because \xA0 is a multibyte character in utf8
      return preg_replace('/^[\s\x0B\xA0]+|[\s\x0B\​xA0]+$/u', '', $self->value);
    },
  'match' => function($regex) use (&$RegExp) {
      $self = Func::getContext();
      $str = $self->value;
      if (!($regex instanceof RegExp)) {
        $regex = $RegExp->construct($regex);
      }
      if (!$regex->globalFlag) {
        return $regex->callMethod('exec', $str);
      }
      $results = new Arr();
      $index = 0;
      $preg = $regex->toString(true);
      while (preg_match($preg, $str, $matches, PREG_OFFSET_CAPTURE, $index) === 1) {
        $foundAt = $matches[0][1];
        $foundStr = $matches[0][0];
        $index = $foundAt + strlen($foundStr);
        $results->push($foundStr);
      }
      return $results;
    },
  'replace' => function($search, $replace) {
      $self = Func::getContext();
      $str = $self->value;
      $isRegEx = ($search instanceof RegExp);
      $limit = ($isRegEx && $search->globalFlag) ? -1 : 1;
      $search = $isRegEx ? $search->toString(true) : to_string($search);
      if ($replace instanceof Func) {
        if ($isRegEx) {
          $count = 0;
          $offset = 0;
          $result = array();
          $success = null;
          while (
              ($limit === -1 || $count < $limit) &&
              ($success = preg_match($search, $str, $matches, PREG_OFFSET_CAPTURE, $offset))
            ) {
            $matchIndex = $matches[0][1];
            $args = array();
            foreach ($matches as $match) {
              $args[] = $match[0];
            }
            $result[] = substr($str, $offset, $matchIndex - $offset);
            //calculate multi-byte character index from match index
            $mbIndex = mb_strlen(substr($str, 0, $matchIndex));
            array_push($args, $mbIndex);
            array_push($args, $str);
            $result[] = to_string($replace->apply(null, $args));
            $offset = $matchIndex + strlen($args[0]);
            $count += 1;
          }
          if ($success === false) {
            //this can happen in the case of invalid utf8 sequences
            throw new Ex(Error::create('String.prototype.replace() failed'));
          }
          $result[] = substr($str, $offset);
          return join('', $result);
        } else {
          $matchIndex = strpos($str, $search);
          if ($matchIndex === false) {
            return $str;
          }
          $before = substr($str, 0, $matchIndex);
          $after = substr($str, $matchIndex + strlen($search));
          //mb_strlen used to calculate multi-byte character index
          $args = array($search, mb_strlen($before), $str);
          return $before . to_string($replace->apply(null, $args)) . $after;
        }
      }
      $replace = to_string($replace);
      if ($isRegEx) {
        $replace = RegExp::toReplacementString($replace);
        return preg_replace($search, $replace, $str, $limit);
      } else {
        $parts = explode($search, $str);
        $first = array_shift($parts);
        return $first . $replace . implode($search, $parts);
      }
    },
  'concat' => function() {
      $self = Func::getContext();
      $result = array($self->value);
      foreach (func_get_args() as $arg) {
        $result[] = to_string($arg);
      }
      return implode('', $result);
    },
  'search' => function($regex) use (&$RegExp) {
      $self = Func::getContext();
      if (!($regex instanceof RegExp)) {
        $regex = $RegExp->construct($regex);
      }
      $preg = $regex->toString(true);
      $success = preg_match($preg, $self->value, $matches, PREG_OFFSET_CAPTURE);
      if (!$success) {
        return -1;
      }
      $start = substr($self->value, 0, $matches[0][1]);
      $startLen = mb_strlen($start);
      return (float)$startLen;
    },
  'toLowerCase' => function() {
      $self = Func::getContext();
      return mb_strtolower($self->value);
    },
  'toLocaleLowerCase' => function() {
      $self = Func::getContext();
      return mb_strtolower($self->value);
    },
  'toUpperCase' => function() {
      $self = Func::getContext();
      return mb_strtoupper($self->value);
    },
  'toLocaleUpperCase' => function() {
      $self = Func::getContext();
      return mb_strtoupper($self->value);
    },
  'localeCompare' => function($compareTo) {
      $self = Func::getContext();
      return (float)strcmp($self->value, to_string($compareTo));
    },
  'valueOf' => function() {
      $self = Func::getContext();
      return $self->value;
    },
  'toString' => function() {
      $self = Func::getContext();
      return $self->value;
    }
);

Str::$protoObject = new Object();
Str::$protoObject->setMethods(Str::$protoMethods, true, false, true);
