FROM node:5.10.0
ADD . /usr/local/src/clusterconfiguration
WORKDIR /usr/local/src/clusterconfiguration
RUN npm install
EXPOSE 8805
CMD [ "node", "/usr/local/src/clusterconfiguration/app.js" ]
