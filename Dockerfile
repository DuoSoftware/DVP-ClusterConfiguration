FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm@2.1.14
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git /usr/local/src/clusterconfiguration
RUN cd /usr/local/src/clusterconfiguration; npm install
CMD ["nodejs", "/usr/local/src/clusterconfiguration/app.js"]

EXPOSE 8805

