<?php
class Func extends Object {
  public $name = "";
  public $className = "Function";

  /* @var callable */
  public $fn = null;
  /* @var null|array */
  public $meta = null;
  /* @var boolean */
  public $strict = false;

  /* @var null|int */
  public $callStackPosition = null;
  /* @var null|array */
  public $args = null;
  /* @var null|array */
  public $boundArgs = null;
  /* @var null|int */
  public $context = null;
  /* @var mixed */
  public $boundContext = null;
  /* @var null|Args */
  public $arguments = null;

  /**
   * Instantiate is an optional method that can be specified if calling `new` on
   * this function should instantiate a different `this` than `new Object()`
   * @var callable
   */
  public $instantiate = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  static $callStack = array();
  static $callStackLength = 0;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    $args = func_get_args();
    if (gettype($args[0]) === 'string') {
      $this->name = array_shift($args);
    }
    $fn = array_shift($args);
    $this->fn = $fn->bindTo($this);
    $this->meta = isset($args[0]) ? $args[0] : array();
    $this->strict = isset($this->meta['strict']);
    $prototype = new Object();
    $prototype->setProperty('constructor', $this, true, false, true);
    $this->setProperty('prototype', $prototype, true, false, true);
  }

  function construct() {
    if ($this->instantiate !== null) {
      $obj = call_user_func($this->instantiate);
    } else {
      $obj = new Object();
      $obj->proto = $this->get('prototype');
    }
    $result = $this->apply($obj, func_get_args());
    return is_primitive($result) ? $obj : $result;
  }

  function call($context = null) {
    $args = array_slice(func_get_args(), 1);
    return $this->apply($context, $args);
  }

  function apply($context, $args) {
    if ($this->boundContext !== null) {
      $context = $this->boundContext;
      if ($this->boundArgs) {
        $args = array_merge($this->boundArgs, $args);
      }
    }
    $this->args = $args;
    if (!$this->strict) {
      if ($context === null || $context === Object::$null) {
        $context = Object::$global;
      } else if (!($context instanceof Object)) {
        //primitives (boolean, number, string) should be wrapped in object
        $context = objectify($context);
      }
    }
    $oldStackPosition = $this->callStackPosition;
    $oldArguments = $this->$arguments;
    $oldContext = $this->context;
    $this->context = $context;
    $this->callStackPosition = self::$callStackLength;
    //add ourself to the call stack, execute, then remove
    self::$callStack[self::$callStackLength++] = $this;
    $result = call_user_func_array($this->fn, $args);
    self::$callStack[--self::$callStackLength] = null;
    $this->callStackPosition = $oldStackPosition;
    $this->$arguments = $oldArguments;
    $this->context = $oldContext;
    return $result;
  }

  function get_name() {
    return $this->name;
  }

  function set_name($value) {
    return $value;
  }

  function get_arguments() {
    $arguments = $this->arguments;
    if ($arguments === null && $this->callStackPosition !== null) {
      $arguments = $this->arguments = Args::create($this);
    }
    return $arguments;
  }

  function set_arguments($value) {
    return $value;
  }

  function get_caller() {
    $stackPosition = $this->callStackPosition;
    if ($stackPosition !== null && $stackPosition > 0) {
      return self::$callStack[$stackPosition - 1];
    } else {
      return null;
    }
  }

  function set_caller($value) {
    return $value;
  }

  function get_length() {
    $reflection = new ReflectionObject($this->fn);
    $method = $reflection->getMethod('__invoke');
    $arity = $method->getNumberOfParameters();
    if ($this->boundArgs) {
      $boundArgsLength = count($this->boundArgs);
      $arity = ($boundArgsLength >= $arity) ? 0 : $arity - $boundArgsLength;
    }
    return (float)$arity;
  }

  function set_length($value) {
    return $value;
  }

  //functions are treated as undefined in JSON.stringify
  function toJSON() {
    return null;
  }

  //a static getter for $this->context
  static function getContext() {
    $func = self::$callStack[self::$callStackLength - 1];
    return $func->context;
  }

  //a static getter for $this->get_arguments()
  static function getArguments() {
    $func = self::$callStack[self::$callStackLength - 1];
    return $func->get_arguments();
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Function = new Func(function($fn) {
      throw new Ex(Error::create('Cannot construct function at runtime.'));
    });
    $Function->set('prototype', Func::$protoObject);
    $Function->setMethods(Func::$classMethods, true, false, true);
    return $Function;
  }
}

class Args extends Object {
  public $length = 0;
  /* @var Func */
  public $callee = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  function toArray() {
    $results = array();
    $len = $this->length;
    for ($i = 0; $i < $len; $i++) {
      $results[] = $this->get($i);
    }
    return $results;
  }

  function get_callee() {
    return $this->callee;
  }

  function set_callee($value) {
    return $value;
  }

  function get_caller() {
    return $this->callee->get_caller();
  }

  function set_caller($value) {
    return $value;
  }

  function get_length() {
    return (float)$this->length;
  }

  function set_length($value) {
    return $value;
  }

  static function create($callee) {
    $self = new Args();
    foreach ($callee->args as $i => $arg) {
      $self->set($i, $arg);
      $self->length += 1;
    }
    return $self;
  }
}

Func::$classMethods = array();

Func::$protoMethods = array(
  'bind' => function($context) {
      $self = $this->context;
      $fn = new Func($self->name, $self->fn, $self->meta);
      $fn->boundContext = $context;
      $args = array_slice(func_get_args(), 1);
      if (!empty($args)) {
        $fn->boundArgs = $args;
      }
      return $fn;
    },
  'call' => function() {
      $args = func_get_args();
      return $this->context->apply($args[0], array_slice($args, 1));
    },
  'apply' => function($context, $args = null) {
      if ($args === null) {
        $args = array();
      } else
      if ($args instanceof Args || $args instanceof Arr) {
        $args = $args->toArray();
      } else {
        throw new Ex(Error::create('Function.prototype.apply: Arguments list has wrong type'));
      }
      return $this->context->apply($context, $args);
    },
  'toString' => function() {
      $source = array_key_exists('source_', $GLOBALS) ? $GLOBALS['source_'] : null;
      if ($source) {
        $meta = $this->context->meta;
        if (isset($meta['id']) && isset($source[$meta['id']])) {
          $source = $source[$meta['id']];
          return substr($source, $meta['start'], $meta['end'] - $meta['start'] + 1);
        }
      }
      return 'function ' . $this->context->name . '() { [native code] }';
    }
);

Func::$protoObject = new Object();
Func::$protoObject->setMethods(Func::$protoMethods, true, false, true);

//set the methods on Object.prototype before we proceed
Object::$protoObject->setMethods(Object::$protoMethods, true, false, true);
