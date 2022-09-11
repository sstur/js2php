#!/bin/bash
tmp=/tmp/performance-comparison.data
echo > $tmp
echo -n "JS (compile tests):  "
while read line
 do
    echo $line | grep done &> /dev/null || continue
    echo -n .
    echo $line | sed -e "s,^.*/\([^/]*\)\.js: \(.*\) ms,\1|js|\2|compile," >> $tmp
done < <(node js2php.js --test)
echo
echo -n "JS (run tests):      "
while read line
 do echo -n .
    echo $line | sed -e "s/^\(.*\), total: \(.*\) ms, each run: \(.*\) ms$/\1|js|\2|run/" >> $tmp
done < <(node performance-tests.js 2>/dev/null)
echo
echo -n "PHP (compile tests): "
while read line
 do
    echo $line | grep done &> /dev/null || continue
    echo -n .
    echo $line | sed -e "s,^.*/\([^/]*\)\.js: \(.*\) ms,\1|php|\2|compile," >> $tmp
done < <(php js2php.php --test)
echo
echo -n "PHP (run tests):     "
declare -a phpData
while read line
 do echo -n .
    echo $line | sed -e "s/^\(.*\), total: \(.*\) ms, each run: \(.*\) ms$/\1|php|\2|run/" >> $tmp
done < <(php performance-tests.php 2>/dev/null)
echo
echo
echo "Comparison Test Runs:"

printf "| %-8s | %9s | %9s | %10s |\n" "Test" "JS" "PHP" "Percentage"
echo "|----------|-----------|-----------|------------|"
tests=$(cat $tmp | grep php | grep run | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3|\1/" | sort -n | sed -e "s/^.*|\(.*$\)/\1/")
for test in $tests
do
  jsValue=$(grep "${test}|js.*run" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3/" )
  phpValue=$(grep "${test}|php.*run" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3/" )
  slowdown="$(( 100 * ($phpValue) / $jsValue ))"
  printf "| %-8s | %6s ms | %6s ms | %8s %% |\n" $test $jsValue $phpValue $slowdown
done
echo
echo "Comparison Compile Times:"
printf "| %-11s | %9s | %9s | %10s |\n" "Test" "JS" "PHP" "Percentage"
echo "|-------------|-----------|-----------|------------|"
tests=$(cat $tmp | grep php | grep compile | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3|\1/" | sort -n | sed -e "s/^.*|\(.*$\)/\1/")
for test in $tests
do
  jsValue=$(grep "${test}|js.*compile" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3/" )
  phpValue=$(grep "${test}|php.*compile" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)|\(.*\)$/\3/" )
  slowdown="$(( 100 * ($phpValue) / $jsValue ))"
  printf "| %-11s | %6s ms | %6s ms | %8s %% |\n" $test $jsValue $phpValue $slowdown
done
