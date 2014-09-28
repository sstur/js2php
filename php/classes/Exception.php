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
    echo $ex->getFile() . "(" . $ex->getLine() . ")\n";
    echo $ex->getMessage() . "\n";
    $stack = $ex->getTrace();
    self::renderStack($stack);
    echo "----\n";
  }

  static function renderStack($stack) {
    $lines = array();
    foreach ($stack as $frame) {
      $args = isset($frame['args']) ? $frame['args'] : array();
      $wrapper = null;
      if ($args[1] instanceof Args) {
        $wrapper = $args[1]->callee;
        $args = $args[1]->args;
      }
      $list = array();
      foreach ($args as $arg) {
        if (is_string($arg)) {
          $list[] = "'" . $arg . "'";
        } else if (is_array($arg)) {
          $list[] = "array()";
        } else if (is_null($arg)) {
          $list[] = 'null';
        } else if (is_bool($arg)) {
          $list[] = ($arg) ? "true" : "false";
        } else if (is_object($arg)) {
          $list[] = get_class($arg);
        } else if (is_resource($arg)) {
          $list[] = get_resource_type($arg);
        } else {
          $list[] = $arg;
        }
      }
      $function = $frame['function'];
      if ($function === '{closure}') {
        $name = $wrapper ? $wrapper->name : '';
        $function = $name ? $name : '<anonymous>';
      }
      if (isset($frame['class'])) {
        $function = $frame['class'] . '->' . $function;
      }
      $line = "    at ";
      if (isset($frame['file'])) {
        $line .= $frame['file'] . "(" . $frame['line'] . ") ";
      }
      $line .= $function . "(" . join(", ", $list) . ") ";
      array_push($lines, $line);
    }
    echo join("\n", $lines) . "\n";
    exit(1);
  }

}

set_exception_handler(array('Ex', 'handleException'));
