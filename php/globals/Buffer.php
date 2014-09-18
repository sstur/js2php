<?php
$Buffer = call_user_func(function() {

  $SHOW_MAX = 51;

  $Buffer = new Func(function($this_, $arguments, $subject = null, $encoding = null, $offset = null) use (&$Buffer) {
    if (!x_instanceof($this_, $Buffer)) {
      return $Buffer->construct($subject, $encoding, $offset);
    }
    $buffer = $this_;
    $type = gettype($subject);
    if ($type === 'integer' || $type === 'double') {
      $buffer->raw = str_repeat("\0", (int)$subject);
    } else if ($type === 'string') {
      $encoding = ($encoding === null) ? 'utf8' : to_string($encoding);
      if ($encoding === 'hex') {
        $buffer->raw = hex2bin($subject);
      } else if ($encoding === 'base64') {
        $buffer->raw = base64_decode($subject);
      } else {
        $buffer->raw = $subject;
      }
    } else if (x_instanceof($subject, $Buffer)) {
      $buffer->raw = $subject->raw;
    } else if ($subject instanceof Arr) {
      $buffer->raw = $util['arrToRaw']($subject);
    } else {
      throw new Ex(Error::create('Invalid parameters to construct Buffer'));
    }
    $len = strlen($buffer->raw);
    //save an integer copy of length for performance
    $buffer->length = $len;
    $buffer->set('length', (float)$len);
    return $buffer;
  });

  $proto = $Buffer->get('prototype');

  $methods = array(
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
    'write' => function($this_, $arguments, $data, $enc = null, $start = null, $len = null) use(&$Buffer) {
        //allow second argument (enc) to be omitted
        if ($arguments->length > 1 && !is_string($enc)) {
          $len = $start;
          $start = $enc;
          $enc = null;
        }
        $data = $Buffer->construct($data, $enc);
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
    'slice' => function($this_, $arguments, $start, $end = null) use(&$Buffer) {
        $len = $this_->length;
        if ($len === 0) {
          return $Buffer->construct(0);
        }
        $start = (int)$start;
        if ($start < 0) {
          $start = $len + $start;
          if ($start < 0) $start = 0;
        }
        if ($start >= $len) {
          return $Buffer->construct(0);
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
        return $Buffer->construct($new, 'binary');
      },
    'toString' => function($this_, $arguments, $enc = 'utf8', $start = null, $end = null) use(&$Buffer) {
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
    'inspect' => function($this_, $arguments) use(&$SHOW_MAX) {
        $raw = $this_->raw;
        if (strlen($raw) > $SHOW_MAX) {
          return '<Buffer ' . bin2hex(substr($raw, 0, $SHOW_MAX)) . '...>';
        } else {
          return '<Buffer ' . bin2hex($raw) . '>';
        }
      },
    'clone' => function($this_, $arguments) use(&$Buffer) {
        return $Buffer->construct($this_->raw, 'binary');
      }
  );

  $proto->setMethods($methods, true, false, true);

  $classMethods = array(
    'isBuffer' => function($this_, $arguments, $obj) use (&$Buffer) {
        return x_instanceof($obj, $Buffer);
      },
    'byteLength' => function($this_, $arguments, $string, $enc = null) use (&$Buffer) {
        $b = $Buffer->construct($string, $enc);
        return $b->length;
      }
  );

  $Buffer->setMethods($classMethods, true, false, true);

  return $Buffer;
});
