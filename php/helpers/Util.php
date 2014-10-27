<?php
class Util {
  /* @var Func */
  static $on = null;
  /* @var Func */
  static $emit = null;

  static function eventify($obj) {
    $obj->set('on', self::$on);
    $obj->set('emit', self::$emit);
  }

}

Util::$on = new Func(function($this_, $arguments, $name, $listener) {
  $events = $this_->get('_events');
  if ($events === null) {
    $events = new Object();
    $this_->set('_events', $events);
  }
  $listeners = $events->get($name);
  if ($listeners === null) {
    $listeners = new Arr();
    $events->set($name, $listeners);
  }
  $listeners->push($listener);
});

Util::$emit = new Func(function($this_, $arguments, $name) {
  $events = $this_->get('_events');
  if ($events === null) {
    return;
  }
  $listeners = $events->get($name);
  if ($listeners === null) {
    return;
  }
  $args = array_slice($arguments->args, 1);
  for ($i = 0; $i < $listeners->length; $i++) {
    $listeners->get($i)->apply($this_, $args);
  }
});
