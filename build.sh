#

path=${PWD#$HOME}
echo path:$path
jekyll build
xdg-open http://yoogle.com:8088$path/_site/
