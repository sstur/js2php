<?php
class Null extends SimpleXmlElement {
  static $null = null;
}
Null::$null = new Null('<false/>');
