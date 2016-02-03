
FROM node:4-onbuild

RUN git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git /usr/local/src/clusterconfiguration
RUN cd /usr/local/src/clusterconfiguration; npm install
CMD ["nodejs", "/usr/local/src/clusterconfiguration/app.js"]

EXPOSE 8805

