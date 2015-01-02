<?php
class Ex extends Exception {
  const MAX_STR_LEN = 32;
  public $value = null;
  static $errorOutputHandlers = array();

  function __construct($value) {
    if ($value instanceof Error) {
      $message = $value->getMessage();
    } else {
      $message = to_string($value);
    }
    parent::__construct($message);
    $this->value = $value;
  }

  /**
   * PHP Errors (or warning/notices) will usually output something to the
   * console and then return some unexpected value like false. Here we cause it
   * to throw instead.
   */
  static function handleError($level, $message, $file, $line, $context) {
    if ($level === E_NOTICE) {
      return false;
    }
    $err = Error::create($message, 1);
    $err->set('level', $level);
    throw new Ex($err);
  }

  /**
   * Since we use a custom exception handler we need to render our own stack trace
   * @param Exception $ex
   */
  static function handleException($ex) {
    global $console;
    $stack = null;
    $output = array();
    if ($ex instanceof Ex) {
      $value = $ex->value;
      if ($value instanceof Error) {
        $stack = $value->stack;
        $frame = array_shift($stack);
        if (isset($frame['file'])) {
          $output[] = $frame['file'] . "(" . $frame['line'] . ")\n";
        }
        $output[] = $value->getMessage() . "\n";
      }
    }
    if ($stack === null) {
      $output[] = $ex->getFile() . "(" . $ex->getLine() . ")\n";
      $output[] = $ex->getMessage() . "\n";
      $stack = $ex->getTrace();
    }
    $output[] = self::renderStack($stack) . "\n";
    $output[] = "----\n";
    $output = implode('', $output);
    foreach(self::$errorOutputHandlers as $fn) {
      $fn($output);
    }
    //an exception could be thrown before we have initialized $console
    if (isset($console) && ($console instanceof Object)) {
      $console->callMethod('log', $output);
    } else {
      echo $output;
    }
    exit(1);
  }

  static function renderStack($stack) {
    $lines = array();
    foreach ($stack as $frame) {
      $args = isset($frame['args']) ? $frame['args'] : array();
      $list = array();
      foreach ($args as $arg) {
        if (is_string($arg)) {
          $list[] = self::stringify($arg);
        } else if (is_array($arg)) {
          $list[] = 'array()';
        } else if (is_null($arg)) {
          $list[] = 'null';
        } else if (is_bool($arg)) {
          $list[] = ($arg) ? 'true' : 'false';
        } else if (is_object($arg)) {
          $class = get_class($arg);
          if ($arg instanceof Object) {
            $constructor = $arg->get('constructor');
            if ($constructor instanceof Func && $constructor->name) {
              $class .= '[' . $constructor->name . ']';
            }
          }
          $list[] = $class;
        } else if (is_resource($arg)) {
          $list[] = get_resource_type($arg);
        } else {
          $list[] = $arg;
        }
      }
      $function = $frame['function'];
      /* todo: use Func::$callStack to resolve anonymous functions */
      //if ($function === '{closure}') {
      //  $name = $wrapper ? $wrapper->name : '';
      //  $function = $name ? $name : '<anonymous>';
      //}
      if ($function === '{closure}') {
        $function = '<anonymous>';
      }
      if (isset($frame['class'])) {
        $function = $frame['class'] . '->' . $function;
      }
      $line = '    at ';
      if (isset($frame['file'])) {
        $line .= $frame['file'] . '(' . $frame['line'] . ') ';
      }
      $line .= $function . '(' . join(', ', $list) . ') ';
      array_push($lines, $line);
    }
    return join("\n", $lines);
  }

  static function stringify($str) {
    $len = strlen($str);
    if ($len === 0) {
      return "''";
    }
    //replace leading extended characters
    $str = preg_replace('/^[^\x20-\x7E]+/', '', $str, 1);
    $trimAt = null;
    $hasExtendedChars = preg_match('/[^\x20-\x7E]/', $str, $matches, PREG_OFFSET_CAPTURE);
    if ($hasExtendedChars === 1) {
      $trimAt = $matches[0][1];
    }
    if ($len > self::MAX_STR_LEN) {
      $trimAt = ($trimAt === null) ? self::MAX_STR_LEN : min($trimAt, self::MAX_STR_LEN);
    }
    if ($trimAt !== null) {
      return "'" . substr($str, 0, $trimAt) . "...'($len)";
    } else {
      return "'" . $str . "'";
    }
  }

}

if (function_exists('set_error_handler')) {
  set_error_handler(array('Ex', 'handleError'));
}
if (function_exists('set_exception_handler')) {
  set_exception_handler(array('Ex', 'handleException'));
}
