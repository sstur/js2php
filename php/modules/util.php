<?php
$process->define('util', call_user_func(function() {

  $on = new Func(function($this_, $arguments, $name, $listener) {
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

  $emit = new Func(function($this_, $arguments, $name) {
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

  $eventify = new Func(function($this_, $arguments, $obj) use (&$on, &$emit) {
    $obj->set('on', $on);
    $obj->set('emit', $emit);
  });

  $util = new Object();
  $util->setProperty('eventify', $eventify, true, false, true);
  return $util;
}));
