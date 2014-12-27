<?php
Module::define('request', function() {
  $SERVER = isset($_SERVER) ? $_SERVER : array();
  $headers = null;
  $methods = array(
    'getMethod' => function() use (&$SERVER) {
        return isset($SERVER['REQUEST_METHOD']) ? $SERVER['REQUEST_METHOD'] : 'GET';
      },
    'getURL' => function() use (&$SERVER) {
        return isset($SERVER['REQUEST_URI']) ? $SERVER['REQUEST_URI'] : '/';
      },
    'getHeaders' => function() use (&$SERVER, &$headers) {
        if ($headers === null) {
          $headers = new Object();
          foreach ($SERVER as $key => $value) {
            if (substr($key, 0, 5) === 'HTTP_') {
              $key = strtolower(substr($key, 5));
              $key = str_replace('_', '-', $key);
              $headers->set($key, $value);
            }
          }
        }
        return $headers;
      },
    'getRemoteAddress' => function() use (&$SERVER) {
        return isset($SERVER['REMOTE_ADDR']) ? $SERVER['REMOTE_ADDR'] : '127.0.0.1';
      },
    'read' => function($bytes) {
        $self = Func::getContext();
        if (!property_exists($self, 'stream')) {
          $self->stream = fopen('php://input', 'r');
        }
        if (feof($self->stream)) {
          fclose($self->stream);
          return Object::$null;
        }
        return new Buffer(fread($self->stream, $bytes));
      },
    'readAll' => function() {
        $data = file_get_contents('php://input');
        return new Buffer($data);
      }
  );
  $request = new Object();
  $request->setMethods($methods, true, false, true);
  return $request;
});

Module::define('response', function() {
  $methods = array(
    'writeHead' => function($statusCode, $statusReason, $headers) {
        //send the response code
        $sapiName = substr(php_sapi_name(), 0, 3);
        if ($sapiName === 'cgi' || $sapiName === 'fpm') {
          header('Status: ' . $statusCode . ' ' . $statusReason);
        } else {
          $protocol = isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0';
          header($protocol . ' ' . $statusCode . ' ' . $statusReason);
        }
        //send the response headers
        $keys = $headers->getOwnKeys(true);
        foreach ($keys as $key) {
          $value = $headers->get($key);
          header($key . ": " . $value);
        }
      },
    'write' => function($data) {
        $data = ($data instanceof Buffer) ? $data->raw : to_string($data);
        echo $data;
      },
    'end' => function() {
        exit();
      }
  );
  $response = new Object();
  $response->setMethods($methods, true, false, true);
  return $response;
});

array_push(Ex::$errorOutputHandlers, function($stackTrace) {
  //don't double echo when in cli (test suite and such)
  if (php_sapi_name() === 'cli') {
    return;
  }
  http_response_code(500);
  header("Content-Type: text/plain");
  echo $stackTrace;
});
