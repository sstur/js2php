<?php
class Date extends Object {
  public $className = "Date";
  /* @var DateTime - date object; second accuracy only; "local" timezone */
  public $date = null;
  /* @var int - ms since 01/01/1970 UTC */
  public $value = null;

  static $LOCAL_TZ = null;
  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() > 0) {
      $this->init(func_get_args());
    }
  }

  function init($arr) {
    $len = count($arr);
    if ($len === 1 && is_string($arr[0])) {
      $this->_initFromString($arr[0]);
    } else {
      $this->_initFromParts($arr);
    }
  }

  function _initFromString($str) {
    $tz = (substr($str, -1) === 'Z') ? 'UTC' : null;
    $arr = self::parse($str);
    $this->_initFromParts($arr, $tz);
  }

  function _initFromParts($arr, $tz = null) {
    $len = count($arr);
    if ($len === 1) {
      $ms = $arr[0];
      $this->value = (float)$ms;
      $this->date = self::fromValue($ms);
      return;
    }
    //allow 0 - 7 parts; default value for each part is 0
    $arr = array_pad($arr, 7, 0);
    $date = self::create($tz);
    if ($len > 1) {
      $date->setDate($arr[0], $arr[1] + 1, $arr[2]);
      $date->setTime($arr[3], $arr[4], $arr[5]);
      $ms = $arr[6];
    } else {
      $seconds = microtime(true);
      $fraction = $seconds - (int)$seconds;
      $ms = (int)($fraction * 1000);
    }
    $this->date = $date;
    $this->value = (float)($date->getTimestamp() * 1000 + $ms);
  }

  function toJSON() {
    $date = self::fromValue($this->value, 'UTC');
    $str = $date->format('Y-m-d\TH:i:s');
    $ms = $this->value % 1000;
    if ($ms < 0) $ms = 1000 + $ms;
    if ($ms < 0) $ms = 0;
    return $str . '.' . substr('00' . $ms, -3) . 'Z';
  }

  static function create($tz = null) {
    if ($tz === null) {
      return new DateTime('now', new DateTimeZone(self::$LOCAL_TZ));
    } else {
      return new DateTime('now', new DateTimeZone($tz));
    }
  }

  static function now() {
    return floor(microtime(true) * 1000);
  }

  static function fromValue($ms, $tz = null) {
    $timestamp = floor($ms / 1000);
    $date = self::create($tz);
    $date->setTimestamp($timestamp);
    return $date;
  }

  static function parse($str) {
    $str = to_string($str);
    $d = date_parse($str);
    //todo: validate $d for errors array and false values
    return array($d['year'], $d['month'] - 1, $d['day'], $d['hour'], $d['minute'], $d['second'], floor($d['fraction'] * 1000));
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Date = new Func(function() {
      $date = new Date();
      $date->init(func_get_args());
      return $date;
    });
    $Date->set('prototype', Date::$protoObject);
    $Date->setMethods(Date::$classMethods, true, false, true);
    return $Date;
  }
}

Date::$classMethods = array(
  'now' => function() {
      return Date::now();
    },
  'parse' => function($str) {
      $date = new Date($str);
      return $date->value;
    },
  'UTC' => function() {
      $date = new Date();
      $date->_initFromParts(func_get_args(), 'UTC');
      return $date->value;
    }
);

Date::$protoMethods = array(
  'valueOf' => function() {
      $self = Func::getContext();
      return $self->value;
    },
  'toJSON' => function() {
      $self = Func::getContext();
      //2014-08-09T12:00:00.000Z
      return $self->toJSON();
    },
  'toUTCString' => function() {
      $self = Func::getContext();
      $date = Date::fromValue($self->value, 'UTC');
      //Sun, 07 Dec 2014 01:10:08 GMT
      return $date->format('D, d M Y H:i:s') . ' GMT';
    },
  'toDateString' => function() {
      throw new Ex(Error::create('date.toDateString not implemented'));
    },
  'getDate' => function() {
      throw new Ex(Error::create('date.getDate not implemented'));
    },
  'getDay' => function() {
      throw new Ex(Error::create('date.getDay not implemented'));
    },
  'getFullYear' => function() {
      throw new Ex(Error::create('date.getFullYear not implemented'));
    },
  'getHours' => function() {
      throw new Ex(Error::create('date.getHours not implemented'));
    },
  'getMilliseconds' => function() {
      throw new Ex(Error::create('date.getMilliseconds not implemented'));
    },
  'getMinutes' => function() {
      throw new Ex(Error::create('date.getMinutes not implemented'));
    },
  'getMonth' => function() {
      throw new Ex(Error::create('date.getMonth not implemented'));
    },
  'getSeconds' => function() {
      throw new Ex(Error::create('date.getSeconds not implemented'));
    },
  'getUTCDate' => function() {
      throw new Ex(Error::create('date.getUTCDate not implemented'));
    },
  'getUTCDay' => function() {
      throw new Ex(Error::create('date.getUTCDay not implemented'));
    },
  'getUTCFullYear' => function() {
      throw new Ex(Error::create('date.getUTCFullYear not implemented'));
    },
  'getUTCHours' => function() {
      throw new Ex(Error::create('date.getUTCHours not implemented'));
    },
  'getUTCMilliseconds' => function() {
      throw new Ex(Error::create('date.getUTCMilliseconds not implemented'));
    },
  'getUTCMinutes' => function() {
      throw new Ex(Error::create('date.getUTCMinutes not implemented'));
    },
  'getUTCMonth' => function() {
      throw new Ex(Error::create('date.getUTCMonth not implemented'));
    },
  'getUTCSeconds' => function() {
      throw new Ex(Error::create('date.getUTCSeconds not implemented'));
    },
  'setDate' => function() {
      throw new Ex(Error::create('date.setDate not implemented'));
    },
  'setFullYear' => function() {
      throw new Ex(Error::create('date.setFullYear not implemented'));
    },
  'setHours' => function() {
      throw new Ex(Error::create('date.setHours not implemented'));
    },
  'setMilliseconds' => function() {
      throw new Ex(Error::create('date.setMilliseconds not implemented'));
    },
  'setMinutes' => function() {
      throw new Ex(Error::create('date.setMinutes not implemented'));
    },
  'setMonth' => function() {
      throw new Ex(Error::create('date.setMonth not implemented'));
    },
  'setSeconds' => function() {
      throw new Ex(Error::create('date.setSeconds not implemented'));
    },
  'setUTCDate' => function() {
      throw new Ex(Error::create('date.setUTCDate not implemented'));
    },
  'setUTCFullYear' => function() {
      throw new Ex(Error::create('date.setUTCFullYear not implemented'));
    },
  'setUTCHours' => function() {
      throw new Ex(Error::create('date.setUTCHours not implemented'));
    },
  'setUTCMilliseconds' => function() {
      throw new Ex(Error::create('date.setUTCMilliseconds not implemented'));
    },
  'setUTCMinutes' => function() {
      throw new Ex(Error::create('date.setUTCMinutes not implemented'));
    },
  'setUTCMonth' => function() {
      throw new Ex(Error::create('date.setUTCMonth not implemented'));
    },
  'setUTCSeconds' => function() {
      throw new Ex(Error::create('date.setUTCSeconds not implemented'));
    },
  'getTimezoneOffset' => function() {
      throw new Ex(Error::create('date.getTimezoneOffset not implemented'));
    },
  'getTime' => function() {
      throw new Ex(Error::create('date.getTime not implemented'));
    },
  'getYear' => function() {
      throw new Ex(Error::create('date.getYear not implemented'));
    },
  'setTime' => function() {
      throw new Ex(Error::create('date.setTime not implemented'));
    },
  'setYear' => function() {
      throw new Ex(Error::create('date.setYear not implemented'));
    },
  'toGMTString' => function() {
      throw new Ex(Error::create('date.toGMTString not implemented'));
    },
  'toISOString' => function() {
      throw new Ex(Error::create('date.toISOString not implemented'));
    },
  'toLocaleDateString' => function() {
      throw new Ex(Error::create('date.toLocaleDateString not implemented'));
    },
  'toLocaleString' => function() {
      throw new Ex(Error::create('date.toLocaleString not implemented'));
    },
  'toLocaleTimeString' => function() {
      throw new Ex(Error::create('date.toLocaleTimeString not implemented'));
    },
  'toTimeString' => function() {
      throw new Ex(Error::create('date.toTimeString not implemented'));
    },
  'toString' => function() {
      $self = Func::getContext();
      //Sat Aug 09 2014 12:00:00 GMT+0000 (UTC)
      return str_replace('~', 'GMT', $self->date->format('D M d Y H:i:s ~O (T)'));
    }
);

Date::$protoObject = new Object();
Date::$protoObject->setMethods(Date::$protoMethods, true, false, true);

//get the local timezone by looking for constant or environment variable; default to UTC
Date::$LOCAL_TZ = defined('LOCAL_TZ') ? constant('LOCAL_TZ') : getenv('LOCAL_TZ');
if (Date::$LOCAL_TZ === false) {
  Date::$LOCAL_TZ = 'UTC';
}
