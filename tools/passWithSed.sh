sed -i '/summary>/d' $1
sed -i '/returns>/d' $1
sed -i '/Suppress/d' $1
sed -i '/using System/d' $1
sed -i '/param name/d' $1
sed -i 's/double/number/g' $1
sed -i 's/yield return/yield/g' $1
sed -i 's/\/\/\//\/\//g' $1
sed -i "s/\bint\b/number/g" $1
sed -i "s/\binternal\b//g" $1
sed -i "s/\bforeach\b/for/g" $1
sed -i 's/ in / of /g' $1
