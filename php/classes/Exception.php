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

  //since we use a custom exception handler we need to render our own stack trace
  static function handleException($ex) {
    echo $ex->getFile() . ':' . $ex->getLine() . "\n";
    echo $ex->getMessage() . "\n";
    $stack = $ex->getTrace();
    array_unshift($stack, array('line' => $ex->getLine(), 'file' => $ex->getFile()));
    foreach ($stack as $frame) {
      echo '    at ' . $frame['file'] . ':' . $frame['line'] . "\n";
    }
    //$trace = 'Fatal error: Uncaught ' . $ex->__toString();
    //Debug::log("__toString:\n" . $trace . "\n----------");
    //echo 'Fatal error: Uncaught exception: ' . $ex->getMessage() . ' in ' . $ex.getFile() . ':' . $ex.getLine() . "\n";
    //$className = get_class($ex);
    //$message = $ex->getMessage();
    //$err = array(
    //  "Fatal error: Uncaught exception: " . $message,
    //  "Stack trace:",
    //  $ex->getTraceAsString()
    //);
    //echo join("\n", $err) . "\n";
  }

}

set_exception_handler(array('Ex', 'handleException'));
