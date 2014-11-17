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

Util::$on = new Func(function($name, $listener) {
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

Util::$emit = new Func(function($name) {
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
