<?php
Module::define('child_process', function() {
  $methods = array(
    'spawn' => function($command, $argArray = null) {
      $argArray = $argArray ? $argArray : new Arr();
      // TODO: Handle arguments correctly that need to be enclosed in " or '
      $process = new React\ChildProcess\Process($command . ' ' . implode(' ', $argArray->toArray()));
      $process->start();
      $jsProcess = new Obj();
      foreach (['stdin', 'stdout', 'stderr'] as $streamName) {
        $jsStream = new Obj();
        (function ($stream) use (&$jsStream) {
          $jsStream->set('on', new Func(function($event, $listener) use (&$stream) {
            $stream->on($event, $listener->fn);
          }));
        })($process->{$streamName});
        $jsProcess->set($streamName, $jsStream);
      }
      $jsProcess->set('on', new Func(function($event, $listener) use (&$process) {
        if ($event === 'close') {
          $event = 'exit';
        }
        $process->on($event, $listener->fn);
      }));
      return $jsProcess;
    }
  );
  $child_process = new Obj();
  $child_process->setMethods($methods, true, false, true);
  return $child_process;
});
