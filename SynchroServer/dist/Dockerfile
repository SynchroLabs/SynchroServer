# Latest Node.js 4.x LTS
FROM node:argon 

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Change this to match your Synchro Server PORT
EXPOSE 1337 

CMD [ "npm", "start" ]
