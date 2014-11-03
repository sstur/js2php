<?php
class Date extends Object {
  public $className = "Date";
  public $date = null;

  static $LOCAL_TZ = null;
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

  function init($arr) {
    $len = count($arr);
    if ($len === 1) {
      $value = $arr[0];
      if (is_int_or_float($value)) {
        $this->_initFromMiliseconds($value);
      } else {
        $this->_initFromString($value);
      }
    } else {
      $this->_initFromParts($arr);
    }
  }

  function _initFromMiliseconds($ms) {
    $this->value = (float)$ms;
    $this->date = self::fromValue($ms);
  }

  function _initFromString($str) {
    $tz = (substr($str, -1) === 'Z') ? 'UTC' : null;
    $arr = self::parse($str);
    $this->_initFromParts($arr, $tz);
  }

  function _initFromParts($arr, $tz = null) {
    //allow 0 - 6 parts; default to 0
    for ($i = 0; $i <= 6; $i++) {
      $arr[$i] = isset($arr[$i]) ? $arr[$i] : 0;
    }
    $date = self::create($tz);
    $date->setDate($arr[0], $arr[1] + 1, $arr[2]);
    $date->setTime($arr[3], $arr[4], $arr[5]);
    $this->date = $date;
    $this->value = (float)($date->getTimestamp() * 1000 + $arr[6]);
  }

  function toJSON() {
    $date = self::fromValue($this->value, 'UTC');
    $str = $date->format('Y-m-d\TH:i:s');
    $ms = '00' . ($this->value % 1000);
    $ms = substr($ms, -3);
    return $str . '.' . $ms . 'Z';
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
    $Date = new Func(function($this_, $arguments) {
      $date = new Date();
      $date->init($arguments->args);
      return $date;
    });
    $Date->set('prototype', Date::$protoObject);
    $Date->setMethods(Date::$classMethods, true, false, true);
    return $Date;
  }
}

Date::$classMethods = array(
  'now' => function($this_) {
      return Date::now();
    },
  'parse' => function($this_, $arguments, $str) {
      $date = new Date($str);
      return $date->value;
    },
  'UTC' => function($this_, $arguments) {
      $date = new Date();
      $date->_initFromParts($arguments->args, 'UTC');
      return $date->value;
    }
);

Date::$protoMethods = array(
  'valueOf' => function($this_) {
      return $this_->value;
    },
  'toJSON' => function($this_) {
      //2014-08-09T12:00:00.000Z
      return $this_->toJSON();
    },
  'toUTCString' => function($this_) {
      //todo
    },
  //todo: toISOString
  'toString' => function($this_) {
      //Sat Aug 09 2014 12:00:00 GMT+0000 (UTC)
      return str_replace('~', 'GMT', $this_->date->format('D M d Y H:i:s ~O (T)'));
    }
);

Date::$protoObject = new Object();
Date::$protoObject->setMethods(Date::$protoMethods, true, false, true);

//get the local timezone by looking for constant or environment variable; default to UTC
Date::$LOCAL_TZ = defined('LOCAL_TZ') ? constant('LOCAL_TZ') : getenv('LOCAL_TZ');
if (Date::$LOCAL_TZ === false) {
  Date::$LOCAL_TZ = 'UTC';
}
