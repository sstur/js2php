<?php
class Buffer extends Object {

  public $raw = '';
  public $length = 0;

  static $protoObject = null;
  static $classMethods = null;
  static $protoMethods = null;

  static $SHOW_MAX = 51;

  function __construct() {
    parent::__construct();
    $this->proto = self::$protoObject;
    if (func_num_args() > 0) {
      $this->init(func_get_args());
    }
  }

  function init($args) {
    global $Buffer;
    list($subject, $encoding, $offset) = array_pad($args, 3, null);
    $type = gettype($subject);
    if ($type === 'integer' || $type === 'double') {
      $this->raw = str_repeat("\0", (int)$subject);
    } else if ($type === 'string') {
      $encoding = ($encoding === null) ? 'utf8' : to_string($encoding);
      if ($encoding === 'hex') {
        //note: this is a workaround for when hex2bin() is not available (v5.3)
        //todo: ensure the hex string length is not odd
        $this->raw = pack('H*', $subject);
      } else if ($encoding === 'base64') {
        $this->raw = base64_decode($subject);
      } else {
        $this->raw = $subject;
      }
    } else if (_instanceof($subject, $Buffer)) {
      $this->raw = $subject->raw;
    } else if ($subject instanceof Arr) {
      $this->raw = $util['arrToRaw']($subject);
    } else {
      throw new Ex(Error::create('Invalid parameters to construct Buffer'));
    }
    $len = strlen($this->raw);
    //save an integer copy of length for performance
    $this->length = $len;
    $this->set('length', (float)$len);
  }

  function toJSON($max = null) {
    $raw = $this->raw;
    if ($max !== null && $max < strlen($raw)) {
      return '<Buffer ' . bin2hex(substr($raw, 0, $max)) . '...>';
    } else {
      return '<Buffer ' . bin2hex($raw) . '>';
    }
  }

  /**
   * Creates the global constructor used in user-land
   * @return Func
   */
  static function getGlobalConstructor() {
    $Buffer = new Func('Buffer', function() {
      $self = new Buffer();
      $self->init(func_get_args());
      return $self;
    });
    $Buffer->set('prototype', Buffer::$protoObject);
    $Buffer->setMethods(Buffer::$classMethods, true, false, true);
    return $Buffer;
  }
}

Buffer::$classMethods = array(
  'isBuffer' => function($obj) {
      global $Buffer;
      return _instanceof($obj, $Buffer);
    },
  'concat' => function(/*Arr*/ $list, $totalLength = null) {
      if (!($list instanceof Arr)) {
        throw new Ex(Error::create('Usage: Buffer.concat(array, [length])'));
      }
      $rawList = array();
      $length = 0;
      foreach ($list->toArray() as $buffer) {
        if (!($buffer instanceof Buffer)) {
          throw new Ex(Error::create('Usage: Buffer.concat(array, [length])'));
        }
        $rawList[] = $buffer->raw;
        $length += $buffer->length;
      }
      $newRaw = join('', $rawList);
      if ($totalLength !== null) {
        $totalLength = (int)$totalLength;
        if ($totalLength > $length) {
          $newRaw .= str_repeat("\0", $totalLength - $length);
        } else if ($totalLength < $length) {
          $newRaw = substr($newRaw, 0, $totalLength);
        }
        $length = $totalLength;
      }
      $newBuffer = new Buffer();
      $newBuffer->raw = $newRaw;
      $newBuffer->length = $length;
      $newBuffer->set('length', (float)$length);
      return $newBuffer;
    },
  'byteLength' => function($string, $enc = null) {
      $b = new Buffer($string, $enc);
      return $b->length;
    }
);

Buffer::$protoMethods = array(
  'get' => function($index) {
      $self = Func::getContext();
      $i = (int)$index;
      if ($i < 0 || $i >= $self->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      return (float)ord($self->raw[$i]);
    },
  'set' => function($index, $byte) {
      $self = Func::getContext();
      $i = (int)$index;
      if ($i < 0 || $i >= $self->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      $old = $self->raw;
      $self->raw = substr($old, 0, $i) . chr($byte) . substr($old, $i + 1);
      return $self->raw;
    },
  //todo: bounds check; see node[test/parallel/test-buffer.js] ~L243 `assert.throws`
  'write' => function($data /*, $offset = null, $len = null, $enc = null*/) {
      $self = Func::getContext();
      //all optional args
      $args = array_slice(func_get_args(), 1);
      //the number of optional args
      $count = func_num_args() - 1;
      $offset = null; $len = null; $enc = null;
      if ($count > 0) {
        //allow write(data, enc), write(data, enc, offset), write(data, enc, offset, length)
        if (is_string($args[0])) {
          $enc = array_shift($args);
          $offset = array_shift($args);
          $len = array_shift($args);
          //allow write(data, offset), write(data, offset, enc), write(data, offset, len), write(data, offset, enc, len)
        } else if (is_int_or_float($args[0])) {
          $offset = array_shift($args);
          $enc = array_pop($args);
          $len = array_pop($args);
          //swap len/enc if necessary
          if (is_int_or_float($enc)) {
            list($len, $enc) = array($enc, $len);
          }
        }
      }
      if (!($data instanceof Buffer)) {
        $data = new Buffer($data, $enc);
      }
      $new = $data->raw;
      if ($len !== null) {
        $newLen = (int)$len;
        $new = substr($new, 0, $newLen);
      } else {
        $newLen = $data->length;
      }
      $offset = (int)$offset;
      $old = $self->raw;
      $oldLen = $self->length;
      if ($offset + $newLen > strlen($old)) {
        $newLen = $oldLen - $offset;
      }
      $pre = ($offset === 0) ? '' : substr($old, 0, $offset);
      $self->raw = $pre . $new . substr($old, $offset + $newLen);
    },
  'slice' => function($start, $end = null) {
      $self = Func::getContext();
      $len = $self->length;
      if ($len === 0) {
        return new Buffer(0);
      }
      $start = (int)$start;
      if ($start < 0) {
        $start = $len + $start;
        if ($start < 0) $start = 0;
      }
      if ($start >= $len) {
        return new Buffer(0);
      }
      $end = ($end === null) ? $len : (int)$end;
      if ($end < 0) {
        $end = $len + $end;
      }
      if ($end < $start) {
        $end = $start;
      }
      if ($end > $len) {
        $end = $len;
      }
      $new = substr($self->raw, $start, $end - $start);
      return new Buffer($new, 'binary');
    },
  'toString' => function($enc = 'utf8', $start = null, $end = null) {
      $self = Func::getContext();
      $raw = $self->raw;
      if (func_num_args() > 1) {
        $raw = substr($raw, $start, $end - $start + 1);
      }
      if ($enc === 'hex') {
        return bin2hex($raw);
      }
      if ($enc === 'base64') {
        return base64_encode($raw);
      }
      return $raw;
    },
  'toJSON' => function() {
      $self = Func::getContext();
      return $self->toJSON();
    },
  'inspect' => function() {
      $self = Func::getContext();
      return $self->toJSON(Buffer::$SHOW_MAX);
    }
);

Buffer::$protoObject = new Object();
Buffer::$protoObject->setMethods(Buffer::$protoMethods, true, false, true);
