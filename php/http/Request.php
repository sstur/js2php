<?php
$process->set('request', call_user_func(function() {
  $headers = null;
  $methods = array(
    'getMethod' => function() {
        return $_SERVER['REQUEST_METHOD'];
      },
    'getURL' => function() {
        return $_SERVER['REQUEST_URI'];
      },
    'getHeaders' => function() use (&$headers) {
        if ($headers === null) {
          $headers = new Object();
          foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) === 'HTTP_') {
              $key = strtolower(substr($key, 5));
              $key = str_replace('_', '-', $key);
              $headers->set($key, $value);
            }
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
  $request = new Object();
  $request->setMethods($methods, true, false, true);
  return $request;
}));
