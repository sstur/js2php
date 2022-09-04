#!/bin/bash
cat js2php.js | grep -v "#\!/" | node js2php.js --runtime runtime.php > js2php.php
cat node_modules/yargs/index.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/yargs/index.php
cat node_modules/yargs/lib/wordwrap.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/yargs/lib/wordwrap.php
cat node_modules/yargs/lib/minimist.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/yargs/lib/minimist.php
cat node_modules/estraverse/estraverse.js  | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/estraverse/index.php
cat node_modules/esprima/esprima.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/esprima/index.php
cat node_modules/path/path.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/path/index.php
cat node_modules/rocambole/rocambole.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/rocambole/index.php
cat node_modules/escope/escope.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > node_modules/escope/index.php
cat tools/transform.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > tools/transform.php
cat tools/codegen.js | grep -v "#\!/" | node js2php.js --runtime runtime.php | grep -v runtime.php > tools/codegen.php
cat tools/utils.js | grep -v "#\!/" | node js2php.js --runtime runtime.php  | grep -v runtime.php > tools/utils.php