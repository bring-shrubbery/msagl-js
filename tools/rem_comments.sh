sed -i 's/\/\/\//\/\//g' $1
sed -i '/summary>/d' $1
sed -i '/param name=/d' $1
sed -i '/returns>/d' $1


