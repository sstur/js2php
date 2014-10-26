<?php
$process->define('fs', call_user_func(function() use (&$process) {

  $CHUNK_SIZE = 1024;

  $util = $process->callMethod('binding', 'util');

  $ReadStream = new Func('ReadStream', function($this_, $arguments, $path, $opts = null) use (&$helpers, &$CHUNK_SIZE) {
    $fullPath = $helpers['mapPath']($path);
    $this_->set('path', $fullPath);
    $opts = ($opts instanceof Object) ? $opts : new Object();
    $this_->set('opts', $opts);
    if (!$opts->hasOwnProperty('chunkSize')) {
      $opts->set('chunkSize', $CHUNK_SIZE);
    }
    try {
      $stream = fopen($fullPath, 'rb');
    } catch(Exception $e) {
      $helpers['handleException']($e, $fullPath);
    }
    //fallback for if set_error_handler didn't do it's thing
    if ($stream === false) {
      $helpers['throwError']('EIO', $fullPath);
    }
    $this_->stream = $stream;
  });

  $prototype = $ReadStream->get('prototype');
  $util->callMethod('eventify', $prototype);
  $prototype->setMethods(array(
    'readBytes' => function($this_, $arguments, $bytes) {
        $stream = $this_->stream;
        if (feof($stream)) {
          return null;
        }
        $data = fread($stream, $bytes);
        $buffer = new Buffer($data);
        $bytesRead = $this_->get('bytesRead');
        if ($bytesRead === null) $bytesRead = 0.0;
        $bytesRead += $buffer->length;
        $this_->set('bytesRead', $bytesRead);
        return $buffer;
      },
    'readAll' => function($this_, $arguments) {
        $chunkSize = $this_->get('opts')->get('chunkSize');
        $stream = $this_->stream;
        $data = array();
        while (!feof($stream)) {
          $data[] = fread($stream, $chunkSize);
        }
        fclose($stream);
        return new Buffer(join('', $data));
      },
    'size' => function($this_, $arguments) {
        $size = $this_->get('bytesTotal');
        if ($size === null) {
          $stat = fstat($this_->stream);
          $size = (float)$stat['size'];
          $this_->set('bytesTotal', $size);
        }
        return $size;
      },
    'read' => function($this_, $arguments) {
        $chunkSize = $this_->get('opts')->get('chunkSize');
        $stream = $this_->stream;
        while (!feof($stream)) {
          $data = fread($stream, $chunkSize);
          $this_->callMethod('emit', 'data', new Buffer($data));
        }
        fclose($stream);
        $this_->callMethod('emit', 'end');
      }
  ), true, false, true);


  $WriteStream = new Func('WriteStream', function($this_, $arguments, $path, $opts = null) use (&$helpers) {
    $fullPath = $helpers['mapPath']($path);
    $this_->set('path', $fullPath);
    $opts = ($opts instanceof Object) ? $opts : new Object();
    $this_->set('opts', $opts);
    //default is to append
    $append = $opts->get('append') !== false;
    //overwrite option will override append
    if ($opts->get('overwrite') === true) {
      $append = false;
    }
    $opts->set('append', $append);
    $mode = $append ? 'ab' : 'wb';
    try {
      $stream = fopen($fullPath, $mode);
    } catch(Exception $e) {
      $helpers['handleException']($e, $fullPath);
    }
    //fallback for if set_error_handler didn't do it's thing
    if ($stream === false) {
      $helpers['throwError']('EIO', $fullPath);
    }
    $this_->stream = $stream;
    $this_->finished = false;
  });

  $prototype = $WriteStream->get('prototype');
  $prototype->setMethods(array(
    'setEncoding' => function($this_, $arguments, $enc) {
        $this_->opts->set('encoding', $enc);
      },
    'write' => function($this_, $arguments, $data, $enc = null) use (&$helpers) {
        if ($this_->finished) return;
        $data = ($data instanceof Buffer) ? $data->raw : $data;
        write_all($this_->stream, $data);
      },
    'end' => function($this_, $arguments) {
        if ($this_->finished) return;
        $this_->finished = true;
        fclose($this_->stream);
      }
  ), true, false, true);


  $methods = array(
    'isFile' => function($this_, $arguments, $path) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        return $helpers['isFile']($fullPath);
      },
    'isDir' => function($this_, $arguments, $path) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        return $helpers['isDir']($fullPath);
      },
    'copyFile' => function($this_, $arguments, $src, $dst) use (&$helpers) {
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
            $helpers['throwError']('ENOTDIR', $dstDir);
          }
        }
        $dst = $dstDir . DIRECTORY_SEPARATOR . $dstName;
        try {
          $result = copy($src, $dst);
        } catch(Exception $e) {
          $helpers['handleException']($e, $src, $dst);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', array($src, $dst));
        }
      },
    'moveFile' => function($this_, $arguments, $src, $dst) use (&$helpers) {
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
          $result = rename($src, $dst);
        } catch(Exception $e) {
          $helpers['handleException']($e, $src, $dst);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', array($src, $dst));
        }
      },
    'deleteFile' => function($this_, $arguments, $path) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        $helpers['deleteFile']($fullPath);
      },
    'deleteFileIfExists' => function($this_, $arguments, $path) use (&$helpers, &$fs) {
        $fullPath = $helpers['mapPath']($path);
        if (!is_file($fullPath)) {
          return;
        }
        $helpers['deleteFile']($fullPath);
      },
    'createDir' => function($this_, $arguments, $path, $opts = null) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        $opts = ($opts instanceof Object) ? $opts : new Object();
        $mode = $helpers['normalizeMode']($opts->get('mode'), 0777);
        $deep = ($opts->get('deep') === true);
        try {
          $result = mkdir($fullPath, $mode, $deep);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
      },
    'removeDir' => function($this_, $arguments, $path, $deep = false) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        $helpers['removeDir']($fullPath, $deep);
      },
    'removeDirIfExists' => function($this_, $arguments, $path, $deep = false) use (&$helpers, &$fs) {
        $fullPath = $helpers['mapPath']($path);
        if (!is_dir($fullPath)) {
          return;
        }
        $helpers['removeDir']($fullPath, $deep);
      },
    'getDirContents' => function($this_, $arguments, $path) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        try {
          $list = scandir($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($list === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
        $arr = array();
        foreach ($list as $item) {
          if ($item === '.' || $item === '..') continue;
          $arr[] = $item;
        }
        return Arr::fromArray($arr);
      },
    'getInfo' => function($this_, $arguments, $path, $deep = false) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        return $helpers['getInfo']($fullPath, $deep);
      },
    'readFile' => function($this_, $arguments, $path, $enc = null) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        try {
          $data = file_get_contents($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($data === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
        if ($enc === null) {
          return new Buffer($data, 'binary');
        } else {
          return $data;
        }
      },
    'writeFile' => function($this_, $arguments, $path, $data, $opts = null) use (&$helpers) {
        $fullPath = $helpers['mapPath']($path);
        $opts = ($opts instanceof Object) ? $opts : new Object();
        //default is to append
        $append = $opts->get('append') !== false;
        //overwrite option will override append
        if ($opts->get('overwrite') === true) {
          $append = false;
        }
        $flags = $append ? FILE_APPEND : 0;
        $data = ($data instanceof Buffer) ? $data->raw : $data;
        try {
          $result = file_put_contents($fullPath, $data, $flags);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
      },
    'createReadStream' => function($this_, $arguments, $path, $opts = null) use (&$helpers, &$ReadStream) {
        return $ReadStream->construct($path, $opts);
      },
    'createWriteStream' => function($this_, $arguments, $path, $opts = null) use (&$helpers, &$WriteStream) {
        return $WriteStream->construct($path, $opts);
      }
  );

  $helpers = array(
    'cwd' => getcwd(),

    'ERR_MAP' => array(
      'EACCES' => "EACCES, permission denied",
      'EBADF' => "EBADF, Bad file descriptor", //todo
      'EEXIST' => "EEXIST, file already exists", //todo (mkdir existing)
      'EIO' => "EIO, Input/output error", //unknown or other
      'ENOENT' => "ENOENT, no such file or directory",
      'ENOTDIR' => "ENOTDIR, not a directory", //todo (rmdir file)
      'ENOTEMPTY' => "ENOTEMPTY, directory not empty",
      'EPERM' => "EPERM, operation not permitted", //todo (unlink dir)
      'EISDIR' => "EISDIR, read", //todo (createReadStream dir)
    ),
    'throwError' => function($code, $paths = array(), $framesToPop = 0) use (&$helpers) {
        $message = $helpers['ERR_MAP'][$code];
        $paths = is_array($paths) ? $paths : array($paths);
        foreach ($paths as $path) {
          $message .= " '" . $helpers['reverseMapPath']($path) . "'";
        }
        $err = Error::create($message, $framesToPop + 1);
        $err->set('code', $code);
        throw new Ex($err);
      },
    'handleException' => function($ex, $paths = array()) use (&$helpers) {
        $message = $ex->getMessage();
        $paths = is_array($paths) ? $paths : array($paths);
        //get the error message with the path(s) removed. this prevents words
        // in the path from effecting our parsing below.
        foreach ($paths as $path) {
          $message = str_replace($path, '', $message);
        }
        $message = trim(array_slice(explode(':', $message), -1)[0]);
        if (strpos($message, 'No such file or directory') !== false) {
          $helpers['throwError']('ENOENT', $paths, 1);
        } else if (strpos($message, 'Permission denied') !== false) {
          $helpers['throwError']('EACCES', $paths, 1);
        } else if (strpos($message, 'stat failed for') !== false) {
          $helpers['throwError']('ENOENT', $paths, 1);
        } else if (strpos($message, 'Directory not empty') !== false) {
          $helpers['throwError']('ENOTEMPTY', $paths, 1);
        } else {
          throw $ex;
        }
      },
    'mapPath' => function($path) use (&$helpers) {
        $path = str_replace('\\', '/', $path);
        $parts = explode('/', $path);
        $normalized = array();
        foreach ($parts as $part) {
          if ($part === '' || $part === '.' || $part === '..') continue;
          $normalized[] = $part;
        }
        return $helpers['cwd'] . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $normalized);
      },
    'reverseMapPath' => function($path) use (&$helpers) {
        $cwd = $helpers['cwd'];
        if ($path === $cwd) {
          return './';
        }
        if (strpos($path, $cwd . DIRECTORY_SEPARATOR) === 0) {
          $path = './' . substr($path, strlen($cwd) + 1);
        }
        return str_replace('\\', '/', $path);
      },
    'isFile' => function($fullPath) use (&$helpers) {
        try {
          $result = is_file($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        return $result;
      },
    'isDir' => function($fullPath) use (&$helpers) {
        try {
          $result = is_dir($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        return $result;
      },
    'getInfo' => function($fullPath, $deep) use (&$helpers) {
        try {
          $stat = stat($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($stat === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
        $isDir = is_dir($fullPath);
        $result = new Object();
        $result->set('name', basename($fullPath));
        $result->set('dateCreated', new Date($stat['ctime'] * 1000));
        $result->set('dateLastAccessed', new Date($stat['atime'] * 1000));
        $result->set('dateLastModified', new Date($stat['mtime'] * 1000));
        $result->set('type', $isDir ? 'directory' : 'file');
        if (!$isDir) {
          $result->set('size', (float)$stat['size']);
        } else if ($deep) {
          $size = 0.0;
          $children = new Arr();
          foreach (scandir($fullPath) as $item) {
            if ($item === '.' || $item === '..') continue;
            $child = $helpers['getInfo']($fullPath . DIRECTORY_SEPARATOR . $item, $deep);
            $size += $child->get('size');
            $children->push($child);
          }
          $result->set('children', $children);
          $result->set('size', $size);
        } else {
          $result->set('size', 0.0);
        }
        return $result;
      },
    'deleteFile' => function($fullPath) use (&$helpers) {
        try {
          $result = unlink($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
      },
    'removeDir' => function($fullPath, $deep = false) use (&$helpers) {
        if ($deep === true) {
          try {
            $list = scandir($fullPath);
          } catch(Exception $e) {
            $helpers['handleException']($e, $fullPath);
          }
          //fallback for if set_error_handler didn't do it's thing
          if ($list === false) {
            $helpers['throwError']('EIO', $fullPath);
          }
          foreach ($list as $name) {
            if ($name === '.' || $name === '..') {
              continue;
            }
            $itemPath = $fullPath . DIRECTORY_SEPARATOR . $name;
            if (is_dir($itemPath)) {
              $helpers['removeDir']($itemPath, true);
            } else {
              $helpers['deleteFile']($itemPath);
            }
          }
        }
        try {
          $result = rmdir($fullPath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullPath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('EIO', $fullPath);
        }
      },
    'normalizeMode' => function($mode, $default) {
        if (is_float($mode)) $mode = (int)$mode;
        if (is_string($mode)) $mode = octdec($mode);
        if (!is_int($mode)) $mode = $default;
        return $mode;
      }
  );

  $fs = new Object();
  $fs->setMethods($methods, true, false, true);
  return $fs;
}));
