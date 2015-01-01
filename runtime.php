<?php
define('LOCAL_TZ', 'America/Phoenix');
mb_internal_encoding('UTF-8');
error_reporting(E_ALL);

require_once('php/helpers/operators.php');
require_once('php/helpers/helpers.php');

require_once('php/classes/Object.php');
require_once('php/classes/Function.php');
require_once('php/classes/Global.php');
require_once('php/classes/Array.php');
require_once('php/classes/Date.php');
require_once('php/classes/RegExp.php');
require_once('php/classes/String.php');
require_once('php/classes/Number.php');
require_once('php/classes/Boolean.php');
require_once('php/classes/Error.php');
require_once('php/classes/Exception.php');
require_once('php/classes/Buffer.php');

require_once('php/globals/globals.php');
require_once('php/globals/Math.php');
require_once('php/globals/JSON.php');
require_once('php/globals/console.php');
require_once('php/globals/process.php');

require_once('php/helpers/Module.php');
require_once('php/modules/http.php');
require_once('php/modules/fs.php');

require_once('php/helpers/Test.php');
require_once('php/helpers/Debug.php');
