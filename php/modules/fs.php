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
    'getDirContents' => function($this_, $arguments, $path) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $list = scandir($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $path);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($list === false) {
          $helpers['throwError']('ENOENT', $path);
        }
        $arr = array();
        foreach ($list as $item) {
          if ($item === '.' || $item === '..') continue;
          $arr[] = $item;
        }
        return Arr::fromArray($arr);
      },
    'walk' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'getInfo' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'readFile' => function($this_, $arguments, $path, $enc = null) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $data = file_get_contents($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $path);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($data === false) {
          $helpers['throwError']('ENOENT', $path);
        }
        if ($enc === null) {
          return new Buffer($data, 'binary');
        } else {
          return $data;
        }
      },
    'writeFile' => function($this_, $arguments, $path, $data, $opts = null) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        $opts = ($opts === null) ? array() : $opts->toArray();
        //default is to append
        $opts['append'] = array_key_exists('append', $opts) ? is($opts['append']) : true;
        //overwrite option will override append
        if (array_key_exists('overwrite', $opts) && $opts['overwrite'] === true) {
          $opts['append'] = false;
        }
        $flags = $opts['append'] ? FILE_APPEND : 0;
        $data = ($data instanceof Buffer) ? $data->raw : $data;
        try {
          $result = file_put_contents($fullpath, $data, $flags);
        } catch(Exception $e) {
          $helpers['handleException']($e, $path);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('ENOENT', $path);
        }
      },
    'createReadStream' => function($this_, $arguments) use (&$methods, &$helpers) {
      },
    'createWriteStream' => function($this_, $arguments) use (&$methods, &$helpers) {
      }
  );

  $helpers = array(
    'cwd' => getcwd(),
    'ERR_MAP' => array(
      'ENOENT' => "ENOENT, no such file or directory '%s'",
      'EACCES' => "EACCES, permission denied '%s'"
    ),
    'throwError' => function($code, $path = null) use (&$methods, &$helpers) {
        $message = sprintf($helpers['ERR_MAP'][$code], $path);
        $err = Error::create($message, 1);
        $err->set('code', $code);
        throw new Ex($err);
      },
    'handleException' => function($e, $path = null) use (&$methods, &$helpers) {
        $message = $e->getMessage();
        if (strpos($message, 'No such file or directory') !== false) {
          $helpers['throwError']('ENOENT', $path);
        } else if (strpos($message, 'Permission denied') !== false) {
          $helpers['throwError']('EACCES', $path);
        } else {
          throw $e;
        }
      },
    'mapPath' => function($path) use (&$methods, &$helpers) {
        $path = str_replace('\\', '/', $path);
        $parts = explode('/', $path);
        $normalized = array();
        foreach ($parts as $part) {
          if ($part === '' || $part === '.' || $part === '..') continue;
          $normalized[] = $part;
        }
        return $helpers['cwd'] . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $normalized);
      },
    'getFile' => function() use (&$methods, &$helpers) {
      },
    'isFile' => function() use (&$methods, &$helpers) {
      },
    'getFileOrDir' => function() use (&$methods, &$helpers) {
      },
    'isDir' => function() use (&$methods, &$helpers) {
      },
    'getInfo' => function() use (&$methods, &$helpers) {
      }
  );

  $fs = new Object();
  $fs->setMethods($methods, true, false, true);
  return $fs;
}));
