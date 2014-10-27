<?php
$process->define('request', function() {
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
        throw new Ex(Error::create('not implemented: Request.read()'));
      }
  );
  $request = new Object();
  $request->setMethods($methods, true, false, true);
  return $request;
});

$process->define('response', function() {
  $methods = array(
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
  $response = new Object();
  $response->setMethods($methods, true, false, true);
  return $response;
});
