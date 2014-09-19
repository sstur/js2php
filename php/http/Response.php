<?php
class Response extends Object {

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
    $protoObject->setMethods(Response::$protoMethods, true, false, true);
    Response::$protoObject = $protoObject;
  }

}

Response::$classMethods = array();

Response::$protoMethods = array(
  'writeHead' => function($this_, $arguments, $statusCode, $statusReason, $headers) {
      http_response_code($statusCode);
      $keys = $headers->getOwnKeys(true);
      foreach ($keys as $key) {
        $value = $headers->get($key);
        header($key . ": " . $value);
      }
    },
  'write' => function($this_, $arguments, $data) {
      $data = ($data instanceof Buffer) ? $data->raw : to_string($data);
      echo $data;
    },
  'end' => function() {
      exit();
    }
);

Response::initProtoMethods();

if (!isset($PHP)) {
  $PHP = new Object();
}
$PHP->set('Response', call_user_func(function() {
  $Response = new Func('Response', function($this_, $arguments) {
    $self = new Response();
    $self->init($arguments->args);
    return $self;
  });
  $Response->setMethods(Response::$classMethods, true, false, true);
  return $Response;
}));