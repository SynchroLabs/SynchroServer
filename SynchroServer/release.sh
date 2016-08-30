#!/bin/sh
#
# Usage: release [npm_version]
#
#     npm_version: The value passed to the 'npm version' command to increment the primary package.json version.
#                  If no version is passed, 'patch' will be used.
#
#     This command will prepare all node modules in the project to be published, including updating their version
#     numbers.  It will also tag the release in git and commit/push the changes and the tag.  The working
#     directory must be clean (from a git perspective) when you run this command.
#

npm_version(){
    npm --no-git-tag-version version $1
}

# First, verify that working directory is clean
if [[ -n $(git status --porcelain) ]]; then 
    echo "Repo is dirty, release failed (no action taken)"
    exit 1 
fi

# Update main synchro-server version (based on argument, default to 'patch')
NPM_VERS=${1:-'patch'}
VERS=$(npm_version $NPM_VERS)
echo "NPM version param: '${NPM_VERS}' updating version to: '${VERS}'"

# Update synchro-api
cd node_modules/synchro-api
npm_version ${VERS}
cd ../..

# Update synchro-studio
cd node_modules/synchro-studio
npm_version ${VERS}
cd ../..

# Update synchro-web
cd node_modules/synchro-web
npm_version ${VERS}
cd ../..

# Update dist
npm prune -production # Remove any devDependenies so they don't generate errors in npm-shinkwrap
npm shrinkwrap
mv npm-shrinkwrap.json dist
cp app.js dist
cd dist
npm_version ${VERS}
cd synchro-apps
npm_version ${VERS}
cd ../..

# Tag the releease, commit the changes made above, and push
git tag -a ${VERS} -m "Release: ${VERS}"
git commit -a -m "Release: ${VERS}"
git push origin --folow-tags
