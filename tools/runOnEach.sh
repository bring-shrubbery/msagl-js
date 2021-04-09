for file in $1/*ts
do
    ~/dev/jagl/tools/rem_comments.sh "$file"
done
