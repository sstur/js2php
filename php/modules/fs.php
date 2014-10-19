<?php
/**
 * todo: for error reporting, subtract cwd from full path
 */
$process->define('fs', call_user_func(function() {

  $methods = array(
    'isFile' => function($this_, $arguments, $path) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['isFile']($fullpath);
      },
    'isDir' => function($this_, $arguments, $path) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['isDir']($fullpath);
      },
    'copyFile' => function($this_, $arguments, $src, $dst) use (&$methods, &$helpers) {
        $src = $helpers['mapPath']($src);
        if (!is_file($src)) {
          $helpers['throwError']('ENOENT', $src);
        }
        $dst = $helpers['mapPath']($dst);
        if (is_dir($dst)) {
          $dstDir = $dst;
          $dstName = basename($src);
        } else {
          $dstDir = dirname($dst);
          $dstName = basename($dst);
          if (!is_dir($dstDir)) {
            $helpers['throwError']('ENOENT', $dstDir);
          }
        }
        $dst = $dstDir . DIRECTORY_SEPARATOR . $dstName;
        try {
          copy($src, $dst);
        } catch(Exception $e) {
          //todo: there could be an error wither either src or dst
          $helpers['handleException']($e, $src, $dst);
        }
      },
    'moveFile' => function($this_, $arguments, $src, $dst) use (&$methods, &$helpers) {
        $src = $helpers['mapPath']($src);
        if (!is_file($src)) {
          $helpers['throwError']('ENOENT', $src);
        }
        $dst = $helpers['mapPath']($dst);
        if (is_dir($dst)) {
          $dstDir = $dst;
          $dstName = basename($src);
        } else {
          $dstDir = dirname($dst);
          $dstName = basename($dst);
          if (!is_dir($dstDir)) {
            $helpers['throwError']('ENOENT', $dstDir);
          }
        }
        $dst = $dstDir . DIRECTORY_SEPARATOR . $dstName;
        try {
          rename($src, $dst);
        } catch(Exception $e) {
          //todo: there could be an error wither either src or dst
          $helpers['handleException']($e, $src, $dst);
        }
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
        throw new Ex(Error::create('Not implemented: fs.walk'));
      },
    'getInfo' => function($this_, $arguments, $path, $deep = false) use (&$methods, &$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['getInfo']($fullpath, $deep);
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
        throw new Ex(Error::create('Not implemented: fs.createReadStream'));
      },
    'createWriteStream' => function($this_, $arguments) use (&$methods, &$helpers) {
        throw new Ex(Error::create('Not implemented: fs.createWriteStream'));
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
        } else if (strpos($message, 'stat failed for') !== false) {
          $helpers['throwError']('ENOENT', $path);
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
    'isFile' => function($fullpath) use (&$methods, &$helpers) {
        try {
          $result = is_file($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        return $result;
      },
    'isDir' => function($fullpath) use (&$methods, &$helpers) {
        try {
          $result = is_dir($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        return $result;
      },
    'getInfo' => function($fullpath, $deep) use (&$methods, &$helpers) {
        //todo: calculate $path for errors
        try {
          $stat = stat($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($stat === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
        $isDir = is_dir($fullpath);
        $result = new Object();
        $result->set('name', basename($fullpath));
        $result->set('dateCreated', new Date($stat['ctime'] * 1000));
        $result->set('dateLastAccessed', new Date($stat['atime'] * 1000));
        $result->set('dateLastModified', new Date($stat['mtime'] * 1000));
        $result->set('type', $isDir ? 'directory' : 'file');
        if (!$isDir) {
          $result->set('size', (float)$stat['size']);
        } else if ($deep) {
          $size = 0.0;
          $children = new Arr();
          foreach (scandir($fullpath) as $item) {
            if ($item === '.' || $item === '..') continue;
            $child = $helpers['getInfo']($fullpath . DIRECTORY_SEPARATOR . $item, $deep);
            $size += $child->get('size');
            $children->push($child);
          }
          $result->set('children', $children);
          $result->set('size', $size);
        } else {
          $result->set('size', 0.0);
        }
        return $result;
      }
  );

  $fs = new Object();
  $fs->setMethods($methods, true, false, true);
  return $fs;
}));
