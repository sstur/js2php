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
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.keys called on non-object'));
      }
      $results = new Arr();
      $results->init($obj->getOwnKeys(true));
      return $results;
    },
    'getOwnPropertyNames' => function($this_, $arguments, $obj) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.getOwnPropertyNames called on non-object'));
      }
      $results = new Arr();
      $results->init($obj->getOwnKeys(false));
      return $results;
    },
    'getOwnPropertyDescriptor' => function($this_, $arguments, $obj, $key) {
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.getOwnPropertyDescriptor called on non-object'));
      }
      $result = $obj->get($key);
      return ($result) ? $result->getDescriptor() : null;
    },
    'defineProperty' => function($this_, $arguments, $obj, $key, $desc) {
      //todo: ensure configurable
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.defineProperty called on non-object'));
      }
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
      if (!($obj instanceof Object)) {
        throw new Ex(Error::create('Object.defineProperties called on non-object'));
      }
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