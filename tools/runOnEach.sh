for file in $1/*ts
do
    ~/dev/jagl/tools/passWithSed.sh "$file"
done
