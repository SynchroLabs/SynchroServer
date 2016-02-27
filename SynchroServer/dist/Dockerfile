# Building a Docker container from an installed and configured Synchro Server is very easy!
#
# The first step is to install Synchro Server using the Synchro CLI command "synchro init" (which
# you have already done if you are reading this).  Then simply add/create your Synchro apps, and
# add any desired configuration to config.json.  You should then be able to run the Synchro Server
# locally using "node app.js" to test your app.
#
# When you are ready to build your Docker container, simply set the SYNCHRO__PORT and any other
# desired environment variables below, then proceed to do your "docker build".

# Latest Node.js 4.x LTS
FROM node:argon 

# NOTE: Set any Synchro env variables here
#
ENV SYNCHRO__PORT 80

# --- You shouldn't need to touch anything below this ---

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Expose the SYNCHRO_PORT set above
EXPOSE $SYNCHRO__PORT 

# Becaue of some issues with orderly shutdown using "npm start" we are using "node app.js"
CMD [ "node", "app.js" ]
