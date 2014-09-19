<?php
class Request extends Object {

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

  function init($args) {
    //$this->set('_super', $args[0]);
  }

  static function initProtoMethods() {
    $protoObject = new Object();
    $protoObject->setMethods(Request::$protoMethods, true, false, true);
    Request::$protoObject = $protoObject;
  }

}

Request::$classMethods = array();

Request::$protoMethods = array(
  'getMethod' => function() {
      return $_SERVER['REQUEST_METHOD'];
    },
  'getURL' => function() {
      //return $_SERVER['REQUEST_URI'] . $_SERVER['QUERY_STRING'];
      return $_SERVER['REQUEST_URI'];
    },
  'getHeaders' => function() {
      $headers = new Object();
      foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 5) === 'HTTP_') {
          $key = strtolower(substr($key, 5));
          $key = str_replace('_', '-', $key);
          $headers->set($key, $value);
        }
      }
      return $headers;
    },
  'getRemoteAddress' => function() {
      return $_SERVER['SERVER_ADDR'];
    },
  'read' => function($bytes) {
      throw new Ex(Error::create('not implemented: Request.read()'));
    }
);

Request::initProtoMethods();

if (!isset($PHP)) {
  $PHP = new Object();
}
$PHP->set('Request', call_user_func(function() {
  $Request = new Func('Request', function($this_, $arguments) {
    $self = new Request();
    $self->init($arguments->args);
    return $self;
  });
  $Request->setMethods(Request::$classMethods, true, false, true);
  $Request->set('sapi_name', php_sapi_name());
  return $Request;
}));