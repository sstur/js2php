<?php
class Ex extends Exception {
  public $value = null;

  function __construct($value) {
    if ($value instanceof Error) {
      $message = $value->get('message');
      $message = $message ? 'Error: ' . $message : 'Error';
    } else {
      $message = to_string($value);
    }
    parent::__construct($message);
    $this->value = $value;
  }

  /**
   * Since we use a custom exception handler we need to render our own stack trace
   * @param Exception $ex
   */
  static function handleException($ex) {
    echo $ex->getFile() . ':' . $ex->getLine() . "\n";
    echo $ex->getMessage() . "\n";
    $stack = $ex->getTrace();
    //the first frame is not on the stack, so add it
    array_unshift($stack, array('line' => $ex->getLine(), 'file' => $ex->getFile()));
    foreach ($stack as $frame) {
      echo '    at ' . $frame['file'] . ':' . $frame['line'] . "\n";
    }
  }

}

set_exception_handler(array('Ex', 'handleException'));
