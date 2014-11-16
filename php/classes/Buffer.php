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
        $this->raw = hex2bin($subject);
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
  'byteLength' => function($string, $enc = null) {
      $b = new Buffer($string, $enc);
      return $b->length;
    }
);

Buffer::$protoMethods = array(
  'get' => function($index) {
      $self = $this->context;
      $i = (int)$index;
      if ($i < 0 || $i >= $self->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      return (float)ord($self->raw[$i]);
    },
  'set' => function($index, $byte) {
      $self = $this->context;
      $i = (int)$index;
      if ($i < 0 || $i >= $self->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      $old = $self->raw;
      $self->raw = substr($old, 0, $i) . chr($byte) . substr($old, $i + 1);
      return $self->raw;
    },
  //todo bounds check
  'write' => function($data, $enc = null, $start = null, $len = null) {
      $self = $this->context;
      //allow second argument (enc) to be omitted
      if (func_num_args() > 1 && !is_string($enc)) {
        $len = $start;
        $start = $enc;
        $enc = null;
      }
      $data = new Buffer($data, $enc);
      $new = $data->raw;
      if ($len !== null) {
        $newLen = (int)$len;
        $new = substr($new, 0, $newLen);
      } else {
        $newLen = $data->length;
      }
      $start = (int)$start;
      $old = $self->raw;
      $oldLen = $self->length;
      if ($start + $newLen > strlen($old)) {
        $newLen = $oldLen - $start;
      }
      $pre = ($start === 0) ? '' : substr($old, 0, $start);
      $self->raw = $pre . $new . substr($old, $start + $newLen);
    },
  'slice' => function($start, $end = null) {
      $self = $this->context;
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
      $raw = $this->context->raw;
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
      return $this->context->toJSON();
    },
  'inspect' => function() {
      return $this->context->toJSON(Buffer::$SHOW_MAX);
    },
  'clone' => function() {
      return new Buffer($this->context->raw, 'binary');
    }
);

Buffer::$protoObject = new Object();
Buffer::$protoObject->setMethods(Buffer::$protoMethods, true, false, true);
