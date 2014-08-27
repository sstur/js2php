<?php
class NaN extends SimpleXmlElement {
  static $nan = null;
}
NaN::$nan = new NaN('<false/>');
