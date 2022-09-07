<?php
class Str extends Obj {
  public $className = "String";
  public $value = null;
  public $isPrimitive = true;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;
  private static $literalCache = [];

  function __construct($str = null) {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() === 1) {
      $this->value = $str;
      $this->length = (float)mb_strlen($str);
    }
  }

  function get_length() {
    return $this->length;
  }

  function set_length($len) {
    return $len;
  }

  public static function str($literal) {
  if (isset(Str::$literalCache[$literal])) {
    return Str::$literalCache[$literal];
  } else {
    return Str::$literalCache[$literal] = new Str($literal);
  }
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
        return Str::str(to_string($value));
      }
    });
    $String->instantiate = function() {
      $result = new Str();
      $result->isPrimitive = false;
      return $result;
    };
    $String->set('prototype', Str::$protoObject);
    $String->setMethods(Str::$classMethods, true, false, true);
    return $String;
  }

  function __toString()
  {
    return $this->value;
  }
}

Str::$classMethods = array(
  'fromCharCode' => function($code) use (&$chr) {
      return $chr($code);
    }
);

Str::$protoMethods = array(
  'charAt' => function($i) {
      $self = Func::getContext();
      $ch = mb_substr($self->value, $i, 1);
      return Str::str(($ch === false) ? '' : $ch);
    },
  'charCodeAt' => function($i) {
      $self = Func::getContext();
      $ch = mb_substr($self->value, $i, 1);
      if ($ch === false) return NAN;
      $len = strlen($ch);
      if ($len === 0) {
        return NAN;
      } else if ($len === 1) {
        $code = ord($ch[0]);
      } else {
        $ch = mb_convert_encoding($ch, 'UCS-2LE', 'UTF-8');
        $code = ord($ch[1]) * 256 + ord($ch[0]);
      }
      return (float)$code;
    },
    'codePointAt' => function($i) {
      $self = Func::getContext();
      $ch = mb_substr($self->value, $i, 1);
      if ($ch === false) return NAN;
      return (float)mb_ord($ch);
    },
  'indexOf' => function($search, $offset = 0) {
      $self = Func::getContext();
      if ($search instanceof Str) {
        $search = $search->value;
      }
      $index = mb_strpos($self->value, $search, $offset);
      return ($index === false) ? -1.0 : (float)$index;
    },
  'lastIndexOf' => function($search, $offset = null) {
      $self = Func::getContext();
      if ($search instanceof Str) {
        $search = $search->value;
      }
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
        $arr = preg_split($delim->toString(true)->value, $str);
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
        return Str::str('');
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return Str::str('');
      }
      if ($num === null) {
        return Str::str(mb_substr($self->value, $start));
      } else {
        return Str::str(mb_substr($self->value, $start, $num));
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
        return Str::str('');
      }
      if ($end < $start) {
        list($start, $end) = array($end, $start);
      }
      return Str::str(mb_substr($self->value, $start, $end - $start));
    },
  'slice' => function($start, $end = null) {
      $self = Func::getContext();
      $len = $self->length;
      if ($len === 0) {
        return Str::str('');
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return Str::str('');
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
      return Str::str(mb_substr($self->value, $start, $end - $start));
    },
  'trim' => function() {
      $self = Func::getContext();
      //todo: unicode [\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​\u2005\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000]
      //note: trim doesn't work here because \xA0 is a multibyte character in utf8
    //return preg_replace('/\xC2\xA0|[\s\x0B\xA0]/', '', $self->value);
      return Str::str(preg_replace('/^[\s\x0B\xA0]+|[\s\x0B\​xA0]+$/u', '', $self->value));
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
      $preg = $regex->toString(true)->value;
      while (preg_match($preg, $str, $matches, PREG_OFFSET_CAPTURE, $index) === 1) {
        $foundAt = $matches[0][1];
        $foundStr = $matches[0][0];
        $index = $foundAt + strlen($foundStr);
        $results->push($foundStr);
      }
      return $index > 0 ? $results : Obj::$null;
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
              ($success = preg_match($search->value, $str, $matches, PREG_OFFSET_CAPTURE, $offset))
            ) {
            $matchIndex = $matches[0][1];
            $args = array();
            foreach ($matches as $match) {
              $args[] = Str::str($match[0]);
            }
            $result[] = substr($str, $offset, $matchIndex - $offset);
            //calculate multi-byte character index from match index
            $mbIndex = mb_strlen(substr($str, 0, $matchIndex));
            array_push($args, $mbIndex);
            array_push($args, $self);
            $result[] = to_string($replace->apply(null, $args));
            $offset = $matchIndex + strlen($args[0]->value);
            $count += 1;
          }
          if ($success === false) {
            //this can happen in the case of invalid utf8 sequences
            throw new Ex(Err::create('String.prototype.replace() failed'));
          }
          $result[] = substr($str, $offset);
          return Str::str(join('', $result));
        } else {
          $matchIndex = strpos($str, $search);
          if ($matchIndex === false) {
            return Str::str($str);
          }
          $before = substr($str, 0, $matchIndex);
          $after = substr($str, $matchIndex + strlen($search));
          //mb_strlen used to calculate multi-byte character index
          $args = array($search, mb_strlen($before), $str);
          return Str::str($before . to_string($replace->apply(null, $args)) . $after);
        }
      }
      $replace = to_string($replace);
      if ($isRegEx) {
        $replace = RegExp::toReplacementString($replace);
        return Str::str(preg_replace($search->value, $replace, $str, $limit));
      } else {
        $parts = explode($search, $str);
        $first = array_shift($parts);
        return Str::str($first . $replace . implode($search, $parts));
      }
    },
  'concat' => function() {
      $self = Func::getContext();
      $result = array($self->value);
      foreach (func_get_args() as $arg) {
        $result[] = to_string($arg);
      }
      return Str::str(implode('', $result));
    },
  'search' => function($regex) use (&$RegExp) {
      $self = Func::getContext();
      if (!($regex instanceof RegExp)) {
        $regex = $RegExp->construct($regex);
      }
      $preg = $regex->toString(true)->value;
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
      return Str::str(mb_strtolower($self->value));
    },
  'toLocaleLowerCase' => function() {
      $self = Func::getContext();
      return Str::str(mb_strtolower($self->value));
    },
  'toUpperCase' => function() {
      $self = Func::getContext();
      return Str::str(mb_strtoupper($self->value));
    },
  'toLocaleUpperCase' => function() {
      $self = Func::getContext();
      return Str::str(mb_strtoupper($self->value));
    },
  'localeCompare' => function($compareTo) {
      $self = Func::getContext();
      return (float)strcmp($self->value, to_string($compareTo));
    },
  'valueOf' => function() {
      $self = Func::getContext();
      return Str::str($self->value);
    },
  'toString' => function() {
      $self = Func::getContext();
      return Str::str($self->value);
    },
    'startsWith' => function($startString) {
      $self = Func::getContext();
      if ($startString instanceof Str) {
        $startString = $startString->value;
      }
      return $startString === mb_substr($self->value, 0, mb_strlen($startString));
    }
);

Str::$protoObject = new Obj();
Str::$protoObject->setMethods(Str::$protoMethods, true, false, true);
