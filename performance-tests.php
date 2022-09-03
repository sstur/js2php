#!/usr/bin/env php
<?php
require_once('runtime.php');
require_once('./test/compiled/helpers.php');
error_reporting(E_ALL & ~E_NOTICE);
$tests = ['core', 'number', 'boolean', 'string', 'date', 'regex', 'array', 'buffer', 'json'];
$processDuration = 0;
foreach ($tests as $test) {
    $path = "./test/compiled/$test.php";
    $startTimeInMs = microtime(true);
    $numOfLoops = 1000;
    for ($j = 0; $j < $numOfLoops; $j++) {
        require($path);
    }
    $endTimeInMms = microtime(true);
    $duration = ($endTimeInMms - $startTimeInMs) * 1000;
    echo "$test, total: $duration ms, each run: " . ($duration / $numOfLoops) . " ms\n";
    $processDuration += $duration;
}
echo "process total: $processDuration ms, each run: " . ($processDuration / $numOfLoops) . " ms\n";