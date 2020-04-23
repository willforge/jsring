#

qm=$(ipfs add -Q -r .)
jekyll build 2>/dev/null
qm=$(ipfs add -Q -r _site)
sed -i -e "s/qm: .*/qm: $qm/" _data/ipfs.yml
jekyll build
qm=$(ipfs add -Q -r _site)
echo url: https://ipfs.io/ipfs/$qm

path=${PWD#$HOME}
echo path:$path
xdg-open http://yoogle.com:8088$path/_site/

