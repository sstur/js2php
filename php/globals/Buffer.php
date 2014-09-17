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
      if ($encoding === 'utf8') {
        //todo: decode?
        $buffer->raw = $subject;
      } else if ($encoding === 'hex') {
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
    $buffer->set('length', strlen($buffer->raw));
    return $buffer;
  });

  $proto = $Buffer->get('prototype');

  $methods = array(
    'get' => function($this_, $arguments, $index) {
        $i = (int)$index;
        return ord($this_->raw[$i]);
      },
    'set' => function($this_, $arguments, $index, $byte) {
        $i = (int)$index;
        $old = $this_->raw;
        $this_->raw = substr($old, 0, $i) . chr($byte) . substr($old, $i + 1);
        return $this_->raw;
      },
    'write' => function($this_, $arguments, $data, $enc, $start, $len) use(&$Buffer) {
        $data = $Buffer->construct($data, $enc);
        $new = $data->raw;
        $len = strlen($new);
        $start = (int)$start;
        $old = $this_->raw;
        $oldLen = strlen($old);
        if ($start + $len > strlen($old)) {
          $len = $oldLen - $start;
        }
        $pre = ($start === 0) ? '' : substr($old, 0, $start);
        $this_->raw = $pre . $new . substr($old, $start + $len + 1);
      },
    'slice' => function($this_, $arguments, $start, $end) use(&$Buffer) {
        $new = substr($this_->raw, $start, $start + $end + 1);
        return $Buffer->construct($new, 'binary');
      },
    'toString' => function($this_, $arguments, $enc = 'utf8', $start = null, $end = null) use(&$Buffer) {
        $raw = $this_->raw;
        if ($arguments->get('length') > 1) {
          $raw = substr($raw, $start, $end - $start + 1);
        }
        if ($enc === 'utf8') {
          //todo: decode?
          return $raw;
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
    'byteLength' => function($this_, $arguments, $string, $encoding) use (&$Buffer) {
        $b = $Buffer->construct($string, $encoding);
        return $b->get('length');
      }
  );

  $Buffer->setMethods($classMethods, true, false, true);

  return $Buffer;
});
