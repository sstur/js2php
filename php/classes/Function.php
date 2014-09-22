<?php
class Func extends Object {
  public $name = "";
  public $className = "[object Function]";

  /**
   * Instantiate is an optional method that can be specified if calling `new` on
   * this function should instantiate a different `this` than `new Object()`
   * @var callable
   */
  public $instantiate = null;
  public $bound = null;
  public $boundArgs = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;
  static $callStack = array();

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    $args = func_get_args();
    if (gettype($args[0]) === 'string') {
      $this->name = array_shift($args);
    }
    $this->fn = array_shift($args);
    $this->meta = (count($args) === 1) ? $args[0] : array();
    $prototype = new Object();
    $prototype->setProperty('constructor', $this, true, false, true);
    $this->setProperty('prototype', $prototype, true, false, true);
    $this->setProperty('arguments', Null::$null, true, false, true);
    $this->setProperty('caller', Null::$null, true, false, true);
  }

  function construct() {
    if ($this->instantiate !== null) {
      $instantiate = $this->instantiate;
      $obj = $instantiate();
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
    if ($this->bound !== null) {
      $context = $this->bound;
    }
    if ($context === null || $context === Null::$null) {
      $context = Object::$global;
    } else
    //primitives (boolean, number, string) should be wrapped in object
    if (!($context instanceof Object)) {
      $context = objectify($context);
    }
    if ($this->boundArgs) {
      $args = array_merge($this->boundArgs, $args);
    }
    $stackSize = count(self::$callStack);
    $caller = $stackSize > 0 ? self::$callStack[$stackSize - 1] : null;
    $arguments = Args::create($args, $this, $caller);
    array_unshift($args, $arguments);
    array_unshift($args, $context);
    //add ourself to the call stack, attach caller and arguments, execute, then undo it all
    self::$callStack[] = $this;
    $this->set('caller', $caller);
    $this->set('arguments', $arguments);
    $result = call_user_func_array($this->fn, $args);
    $this->set('arguments', Null::$null);
    $this->set('caller', Null::$null);
    array_pop(self::$callStack);
    return $result;
  }

  function get_name() {
    return $this->name;
  }

  function set_name($value) {
    return $value;
  }

  function get_length() {
    $r = new ReflectionObject($this->fn);
    $m = $r->getMethod('__invoke');
    $arity = $m->getNumberOfParameters();
    $arity = ($arity <= 2) ? 0 : $arity - 2;
    if ($this->boundArgs) {
      $bound = count($this->boundArgs);
      $arity = ($bound >= $arity) ? 0 : $arity - $bound;
    }
    return (float)$arity;
  }

  function set_length($value) {
    return $value;
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Function = new Func(function($this_, $arguments, $fn) {
      throw new Ex(Error::create('Cannot construct function at runtime.'));
    });
    $Function->set('prototype', Func::$protoObject);
    $Function->setMethods(Func::$classMethods, true, false, true);
    return $Function;
  }
}

class Args extends Object {
  public $args = null;
  public $length = null;
  public $callee = null;
  public $caller = null;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  static function create($args, $callee, $caller = null) {
    $self = new Args();
    $self->args = $args;
    $len = count($args);
    $self->length = $len;
    $self->callee = $callee;
    $self->caller = $caller;
    for ($i = 0; $i < $len; $i++) {
      $self->set($i, $args[$i]);
    }
    $self->set('length', (float)$len);
    $self->setProperty('callee', $callee, true, false, true);
    $self->setProperty('caller', $caller, true, false, true);
    return $self;
  }
}

//set the methods on Object.prototype before we proceed
Object::$protoObject->setMethods(Object::$protoMethods, true, false, true);

Func::$classMethods = array();

Func::$protoMethods = array(
  'bind' => function($this_, $arguments, $context) {
      $fn = new Func($this_->name, $this_->fn, $this_->meta);
      $fn->bound = $context;
      $args = func_get_args();
      if (count($args) > 3) {
        $fn->boundArgs = array_slice($args, 3);
      }
      return $fn;
    },
  'call' => function($this_, $arguments) {
      $args = $arguments->args;
      $context = array_shift($args);
      return $this_->apply($context, $args);
    },
  'apply' => function($this_, $arguments, $context, $args) {
      //convert Arr object to native array()
      $args = $args->toArray();
      return $this_->apply($context, $args);
    },
  'toString' => function($this_) {
      if ($GLOBALS['source_'] && $this_->source_id) {
        $meta = $this_->meta;
        $source = $GLOBALS['source_'][$meta->id];
        return substr($source, $meta->start, $meta->end - $meta->start + 1);
      }
      return 'function ' . $this_->name . '() { [native code] }';
    }
);

Func::$protoObject = new Object();
Func::$protoObject->setMethods(Func::$protoMethods, true, false, true);
