<?php
/**
 * todo: for error reporting, subtract cwd from full path
 */
$process->define('fs', call_user_func(function() use (&$process) {

  $CHUNK_SIZE = 1024;

  $util = $process->callMethod('binding', 'util');

  $ReadStream = new Func('ReadStream', function($this_, $arguments, $path, $opts) use (&$helpers, &$CHUNK_SIZE) {
    $fullpath = $helpers['mapPath']($path);
    $this_->set('path', $fullpath);
    if (!$opts->hasOwnProperty('chunkSize')) {
      $opts->set('chunkSize', $CHUNK_SIZE);
    }
    $this_->set('opts', $opts);
    try {
      $stream = fopen($fullpath, 'rb');
    } catch(Exception $e) {
      $helpers['handleException']($e, $fullpath);
    }
    //fallback for if set_error_handler didn't do it's thing
    if ($stream === false) {
      $helpers['throwError']('ENOENT', $fullpath);
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


  $WriteStream = new Func('WriteStream', function($this_, $arguments, $path, $opts) use (&$helpers) {
    $fullpath = $helpers['mapPath']($path);
    $this_->set('path', $fullpath);
    $this_->set('opts', $opts);
    $mode = $opts->get('append') ? 'ab' : 'wb';
    try {
      $stream = fopen($fullpath, $mode);
    } catch(Exception $e) {
      $helpers['handleException']($e, $fullpath);
    }
    //fallback for if set_error_handler didn't do it's thing
    if ($stream === false) {
      $helpers['throwError']('ENOENT', $fullpath);
    }
    $this_->stream = $stream;
  });

  $prototype = $WriteStream->get('prototype');
  $prototype->setMethods(array(
    'setEncoding' => function($this_, $arguments, $enc) {
        $this_->opts->set('encoding', $enc);
      },
    'write' => function($this_, $arguments, $data, $enc) use (&$helpers) {
        if ($this_->finished) return;
        $data = ($data instanceof Buffer) ? $data->raw : $data;
        $helpers['writeAll']($this_->stream, $data);
      },
    'end' => function($this_, $arguments) {
        if ($this_->finished) return;
        $this_->finished = true;
        fclose($this_->stream);
      }
  ), true, false, true);


  $methods = array(
    'isFile' => function($this_, $arguments, $path) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['isFile']($fullpath);
      },
    'isDir' => function($this_, $arguments, $path) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['isDir']($fullpath);
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
          rename($src, $dst);
        } catch(Exception $e) {
          //todo: there could be an error wither either src or dst
          $helpers['handleException']($e, $src, $dst);
        }
      },
    'deleteFile' => function($this_, $arguments, $path) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $result = unlink($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
      },
    'deleteFileIfExists' => function($this_, $arguments, $path) use (&$helpers, &$fs) {
        try {
          $fs->callMethod('deleteFile', $path);
        } catch(Exception $ex) {
          $e = ($ex instanceof Ex) ? $ex->value : null;
          if (!($e instanceof Error) || $e->get('code') !== 'ENOENT') {
            throw $ex;
          }
        }
      },
    'createDir' => function($this_, $arguments, $path, $opts = null) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        $opts = ($opts instanceof Object) ? $opts : new Object();
        $mode = $helpers['normalizeMode']($opts->get('mode'), 0777);
        $deep = ($opts->get('deep') === true);
        try {
          $result = mkdir($fullpath, $mode, $deep);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
      },
    //todo: deep
    'removeDir' => function($this_, $arguments, $path) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $result = rmdir($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
      },
    'removeDirIfExists' => function($this_, $arguments, $path) use (&$helpers, &$fs) {
        try {
          $fs->callMethod('removeDir', $path);
        } catch(Exception $ex) {
          $e = ($ex instanceof Ex) ? $ex->value : null;
          if (!($e instanceof Error) || $e->get('code') !== 'ENOENT') {
            throw $ex;
          }
        }
      },
    'getDirContents' => function($this_, $arguments, $path) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $list = scandir($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($list === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
        $arr = array();
        foreach ($list as $item) {
          if ($item === '.' || $item === '..') continue;
          $arr[] = $item;
        }
        return Arr::fromArray($arr);
      },
    'walk' => function($this_, $arguments) use (&$helpers) {
        throw new Ex(Error::create('Not implemented: fs.walk'));
      },
    'getInfo' => function($this_, $arguments, $path, $deep = false) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        return $helpers['getInfo']($fullpath, $deep);
      },
    'readFile' => function($this_, $arguments, $path, $enc = null) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
        try {
          $data = file_get_contents($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($data === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
        if ($enc === null) {
          return new Buffer($data, 'binary');
        } else {
          return $data;
        }
      },
    'writeFile' => function($this_, $arguments, $path, $data, $opts = null) use (&$helpers) {
        $fullpath = $helpers['mapPath']($path);
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
          $result = file_put_contents($fullpath, $data, $flags);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        //fallback for if set_error_handler didn't do it's thing
        if ($result === false) {
          $helpers['throwError']('ENOENT', $fullpath);
        }
      },
    //todo: so here we normalize the $opts, but not the $path?
    'createReadStream' => function($this_, $arguments, $path, $opts = null) use (&$helpers, &$WriteStream) {
        $opts = ($opts instanceof Object) ? $opts : new Object();
        //default is to append
        $append = $opts->get('append') !== false;
        //overwrite option will override append
        if ($opts->get('overwrite') === true) {
          $append = false;
        }
        $opts->set('append', $append);
        return $WriteStream->construct($path, $opts);
      },
    'createWriteStream' => function($this_, $arguments, $path, $opts) use (&$helpers, &$ReadStream) {
        $opts = ($opts instanceof Object) ? $opts : new Object();
        return $ReadStream->construct($path, $opts);
      }
  );

  $helpers = array(
    'cwd' => getcwd(),
    'ERR_MAP' => array(
      'EACCES' => "EACCES, permission denied '%s'",
      'ENOENT' => "ENOENT, no such file or directory '%s'",
      'ENOTEMPTY' => "ENOTEMPTY, directory not empty '%s'"
    ),
    'throwError' => function($code, $path = null, $framesToPop = 0) use (&$helpers) {
        $message = sprintf($helpers['ERR_MAP'][$code], $path);
        $err = Error::create($message, $framesToPop + 1);
        $err->set('code', $code);
        throw new Ex($err);
      },
    'handleException' => function($ex, $path = null) use (&$helpers) {
        $message = $ex->getMessage();
        if (strpos($message, 'No such file or directory') !== false) {
          $helpers['throwError']('ENOENT', $path, 1);
        } else if (strpos($message, 'Permission denied') !== false) {
          $helpers['throwError']('EACCES', $path, 1);
        } else if (strpos($message, 'stat failed for') !== false) {
          $helpers['throwError']('ENOENT', $path, 1);
        } else if (strpos($message, 'Directory not empty') !== false) {
          $helpers['throwError']('ENOTEMPTY', $path, 1);
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
    'writeAll' => function($stream, $data, $bytesTotal = null) {
        if ($bytesTotal === null) {
          $bytesTotal = strlen($data);
        }
        $bytesWritten = 0;
        //some platforms require multiple calls to fwrite
        while ($bytesWritten < $bytesTotal) {
          $bytesWritten += fwrite($stream, substr($data, $bytesWritten));
        }
      },
    'isFile' => function($fullpath) use (&$helpers) {
        try {
          $result = is_file($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        return $result;
      },
    'isDir' => function($fullpath) use (&$helpers) {
        try {
          $result = is_dir($fullpath);
        } catch(Exception $e) {
          $helpers['handleException']($e, $fullpath);
        }
        return $result;
      },
    'getInfo' => function($fullpath, $deep) use (&$helpers) {
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
