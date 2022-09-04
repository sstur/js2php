<?php
$require = new Func(function ($name, $caller_dir = null) {
  global $require, $JSON;
  $module = Module::get($name);
  if ($module) {
    return $module;
  }
  $base_path = $caller_dir ? $caller_dir : $require->get('base_path');
  $node_modules_path = $require->get('node_modules_path');
  if (!$base_path) {
    $base_path = getcwd();
  }
  $cacheKey = $base_path . ':' . $name;
  $cache = $require->get('cache');
  $result = $cache->get($cacheKey);
  if ($result) {
    return $result;
  }
  $isJson = false;
  if ($name[0] === '.' || $name[0] === '/') {
    // this is a relative or absolute path
    if (preg_match('/^(.*).(js|json)$/', $name, $matches)) {
      if ($matches[2] === 'js') {
        // replace .js ending
        $path = $base_path . '/' . $matches[1] . '.php';
      } else {
        $isJson = true;
        $path = $base_path . '/' . $name;
      }
    } else {
      // append .php
      $path = $base_path . '/' . $name . '.php';
    }
  } else {
    // this module name must be searched in node_modules directory
    if (!$node_modules_path) {
      throw new Exception('node_modules directory not found');
    }
    if (!is_dir($node_modules_path . '/' . $name)) {
      throw new Exception("module '$name' not found in node_modules directory");
    }
    $path = $node_modules_path . '/' . $name . '/index.php';
  }
  if (!is_file($path)) {
    throw new Exception("File '$path' could not be found for module '$name'");
  }
  $path = realpath($path);
  $result = $cache->get($path);
  if ($result) {
    return $result;
  }
  if ($isJson) {
    $content = file_get_contents($path);
    $result = call_method($JSON, 'parse', $content);
  } else {
    try {
      $require->set('base_path', dirname($path));
      $result = $require->callMethod('invokeNativeRequire', $path);
    } finally {
      $require->set('base_path', $base_path);
    }
  }
  $cache->set($cacheKey, $result);
  $cache->set($path, $result);
  return $result;
});

$require->setMethods(array(
    'invokeNativeRequire' => function ($path) {
      $module = new Obj();
      $exports = new Obj();
      $module->set('exports', $exports);
      // globals must be available in the included code
      foreach ($GLOBALS as $key => $val) {
        global $$key;
      }
      require $path;
      return $module->get('exports');
    }
));

if (is_dir('node_modules')) {
  $require->set('node_modules_path', realpath('node_modules'));
}

$require->set('cache', new Obj());