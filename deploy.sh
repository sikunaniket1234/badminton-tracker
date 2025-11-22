#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output
cd dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'Deploy to gh-pages'
git branch -M gh-pages
git remote add origin https://github.com/sikunaniket1234/badminton-tracker.git
git push -u origin gh-pages --force

cd -
