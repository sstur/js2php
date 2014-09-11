<?php
$Object = call_user_func(function() {
  $Object = new Func(function($this_) {
    return new Object();
  });
  $Object->set('prototype', Object::$protoObject);
  //define "static" methods
  $methods = array(
    //todo: getPrototypeOf, seal, freeze, preventExtensions, isSealed, isFrozen, isExtensible
    'create' => function($this_, $arguments, $proto) {
      $obj = new Object();
      $obj->setProto($proto);
      return $obj;
    },
    'keys' => function($this_, $arguments, $obj) {
      //todo: if (!($obj instanceof Object)) throw new Exception();
      $results = new Arr();
      if (method_exists($obj, 'keys')) {
        foreach ($obj->keys() as $i => $key) {
          $results->push($key);
        }
      } else {
        foreach ($obj->data as $key => $prop) {
          if ($prop->enumerable) {
            $results->push($key);
          }
        }
      }
      return $results;
    },
    'getOwnPropertyNames' => function($this_, $arguments, $obj) {
      //todo: if (!($obj instanceof Object)) throw new Exception();
      $results = new Arr();
      if (method_exists($obj, 'keys')) {
        foreach ($obj->keys() as $i => $key) {
          $results->push($key);
        }
      } else {
        foreach ($obj->data as $key => $prop) {
          $results->push($key);
        }
      }
      return $results;
    },
    'getOwnPropertyDescriptor' => function($this_, $arguments, $obj, $key) {
      //todo: if (!($obj instanceof Object)) throw new Exception();
      $result = $obj->get($key);
      return ($result) ? $result->getDescriptor() : null;
    },
    'defineProperty' => function($this_, $arguments, $obj, $key, $desc) {
      //todo: if (!($obj instanceof Object)) throw new Exception();
      $value = $desc->get('value');
      $writable = $desc->get('writable');
      if ($writable === null) $writable = true;
      $enumerable = $desc->get('enumerable');
      if ($enumerable === null) $enumerable = true;
      $configurable = $desc->get('configurable');
      if ($configurable === null) $configurable = true;
      $obj->data->{$key} = new Property($value, $writable, $enumerable, $configurable);
    },
    'defineProperties' => function($this_, $arguments, $obj, $items) use (&$methods) {
      //todo: if (!($obj instanceof Object)) throw new Exception();
      foreach ($items->data as $key => $prop) {
        if ($prop->enumerable) {
          $methods['defineProperty'](null, null, $obj, $key, $prop->value);
        }
      }
    }
  );
  $Object->setMethods($methods, true, false, true);
  return $Object;
});