#!/bin/bash
echo Running tests
#helper to overcome problems with arrays and loops
tmp=/tmp/performance-comparison.data
echo > $tmp
echo -n "JS:  "
while read line
 do echo -n .
    echo $line | sed -e "s/^\(.*\), total: \(.*\) ms, each run: \(.*\) ms$/\1|js|\2/" >> $tmp
done < <(node performance-tests.js 2>/dev/null)
echo
echo -n "PHP: "
declare -a phpData
while read line
 do echo -n .
    echo $line | sed -e "s/^\(.*\), total: \(.*\) ms, each run: \(.*\) ms$/\1|php|\2/" >> $tmp
done < <(php performance-tests.php 2>/dev/null)
echo
echo
echo "Comparison Result:"

printf "| %-8s | %9s | %9s | %10s |\n" "Test" "JS" "PHP" "Slowdown"
echo "|----------|-----------|-----------|------------|"
tests=$(cat $tmp | grep php | sed -e "s/^\(.*\)|\(.*\)|\(.*\)$/\3|\1/" | sort -n | sed -e "s/^.*|\(.*$\)/\1/")
for test in $tests
do
  jsValue=$(grep "${test}|js" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)$/\3/" )
  phpValue=$(grep "${test}|php" $tmp | head -n 1 | sed -e "s/^\(.*\)|\(.*\)|\(.*\)$/\3/" )
  slowdown="$(( 100 * ($phpValue - $jsValue) / $jsValue ))"
  printf "| %-8s | %6s ms | %6s ms | %8s %% |\n" $test $jsValue $phpValue $slowdown
done
