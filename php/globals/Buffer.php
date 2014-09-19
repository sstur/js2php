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
    $subject = $args[0];
    $encoding = $args[1];
    $offset = $args[2];
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
    } else if (x_instanceof($subject, $Buffer)) {
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

  static function initProtoMethods() {
    $protoObject = new Object();
    $protoObject->setMethods(Buffer::$protoMethods, true, false, true);
    Buffer::$protoObject = $protoObject;
  }

}

Buffer::$classMethods = array(
  'isBuffer' => function($this_, $arguments, $obj) {
      global $Buffer;
      return x_instanceof($obj, $Buffer);
    },
  'byteLength' => function($this_, $arguments, $string, $enc = null) {
      $b = new Buffer($string, $enc);
      return $b->length;
    }
);

Buffer::$protoMethods = array(
  'get' => function($this_, $arguments, $index) {
      $i = (int)$index;
      if ($i < 0 || $i >= $this_->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      return (float)ord($this_->raw[$i]);
    },
  'set' => function($this_, $arguments, $index, $byte) {
      $i = (int)$index;
      if ($i < 0 || $i >= $this_->length) {
        throw new Ex(Error::create('offset is out of bounds'));
      }
      $old = $this_->raw;
      $this_->raw = substr($old, 0, $i) . chr($byte) . substr($old, $i + 1);
      return $this_->raw;
    },
  //todo bounds check
  'write' => function($this_, $arguments, $data, $enc = null, $start = null, $len = null) {
      //allow second argument (enc) to be omitted
      if ($arguments->length > 1 && !is_string($enc)) {
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
      $old = $this_->raw;
      $oldLen = $this_->length;
      if ($start + $newLen > strlen($old)) {
        $newLen = $oldLen - $start;
      }
      $pre = ($start === 0) ? '' : substr($old, 0, $start);
      $this_->raw = $pre . $new . substr($old, $start + $newLen);
    },
  'slice' => function($this_, $arguments, $start, $end = null) {
      $len = $this_->length;
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
      $new = substr($this_->raw, $start, $end - $start);
      return new Buffer($new, 'binary');
    },
  'toString' => function($this_, $arguments, $enc = 'utf8', $start = null, $end = null) {
      $raw = $this_->raw;
      if ($arguments->get('length') > 1) {
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
  'toJSON' => function($this_, $arguments) {
      $raw = $this_->raw;
      return '<Buffer ' . bin2hex($raw) . '>';
    },
  'inspect' => function($this_, $arguments) {
      $raw = $this_->raw;
      if (strlen($raw) > Buffer::$SHOW_MAX) {
        return '<Buffer ' . bin2hex(substr($raw, 0, Buffer::$SHOW_MAX)) . '...>';
      } else {
        return '<Buffer ' . bin2hex($raw) . '>';
      }
    },
  'clone' => function($this_, $arguments) {
      return new Buffer($this_->raw, 'binary');
    }
);

Buffer::initProtoMethods();

$Buffer = new Func('Buffer', function($this_, $arguments) {
  $self = new Buffer();
  $self->init($arguments->args);
  return $self;
});

$Buffer->setMethods(Buffer::$classMethods, true, false, true);
