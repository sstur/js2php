<?php
$process->define('fs', call_user_func(function() {

  $methods = array(
    'isFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'isDir' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'copyFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'moveFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'deleteFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'deleteFileIfExists' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'createDir' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'removeDir' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'removeDirIfExists' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'getDirContents' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'walk' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'getInfo' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'readFile' => function($this_, $arguments, $path, $enc = null) use (&$methods, &$helpers) {
        $data = file_get_contents($path);
        if ($data === false) {
          throw $helpers['ENOENT']();
        }
        if ($enc === null) {
          return new Buffer($data, 'binary');
        } else {
          return $data;
        }
      },
    'writeFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'createReadStream' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'createWriteStream' => function($this_, $arguments) use (&$methods, &$helpers) {
      }
  );

  $helpers = array(
    'ENOENT' => function() {
        $message = 'ENOENT';
        $err = Error::create($message, 1);
        $err->set('code', 'ENOENT');
        return new Ex($err);
      },
    'getFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'isFile' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'getFileOrDir' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'isDir' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'getInfo' => function($this_, $arguments) use (&$methods, &$helpers) {
      }
  );

  $fs = new Object();
  $fs->setMethods($methods, true, false, true);
  return $fs;
}));
