<?php
class Module {
  /* @var Func */
  static $on = null;
  /* @var Func */
  static $emit = null;
  /* @var array */
  static $definitions = array();
  /* @var array */
  static $modules = array();

  /**
   * @param string $name
   * @param callable $fn
   */
  static function define($name, $fn) {
    self::$definitions[$name] = $fn;
  }

  /**
   * @param string $name
   * @return mixed
   */
  static function get($name) {
    $modules = self::$modules;
    if (array_key_exists($name, $modules)) {
      return $modules[$name];
    }
    $definitions = self::$definitions;
    if (array_key_exists($name, $definitions)) {
      $definition = $definitions[$name];
      $module = $definition();
      $modules[$name] = $module;
      return $module;
    }
    return null;
  }

  /**
   * @param Object $obj
   */
  static function eventify($obj) {
    $obj->set('on', self::$on);
    $obj->set('emit', self::$emit);
  }

}

Module::$on = new Func(function($name, $listener) {
  $self = Func::getContext();
  $events = $self->get('_events');
  if ($events === null) {
    $events = new Object();
    $self->set('_events', $events);
  }
  $listeners = $events->get($name);
  if ($listeners === null) {
    $listeners = new Arr();
    $events->set($name, $listeners);
  }
  $listeners->push($listener);
});

Module::$emit = new Func(function($name) {
  $self = Func::getContext();
  $events = $self->get('_events');
  if ($events === null) {
    return;
  }
  $listeners = $events->get($name);
  if ($listeners === null) {
    return;
  }
  $args = array_slice(func_get_args(), 1);
  for ($i = 0; $i < $listeners->length; $i++) {
    $listeners->get($i)->apply($self, $args);
  }
});
