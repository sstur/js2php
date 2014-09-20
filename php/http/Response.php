<?php
$process->set('response', call_user_func(function() {
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
}));
