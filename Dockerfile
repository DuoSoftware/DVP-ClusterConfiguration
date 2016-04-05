#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm
#RUN git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git /usr/local/src/clusterconfiguration
#RUN cd /usr/local/src/clusterconfiguration; npm install
#CMD ["nodejs", "/usr/local/src/clusterconfiguration/app.js"]

#EXPOSE 8805


FROM node:5.10.0
RUN git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git /usr/local/src/clusterconfiguration
RUN cd /usr/local/src/clusterconfiguration;
WORKDIR /usr/local/src/clusterconfiguration
RUN npm install
EXPOSE 8805
CMD [ "node", "/usr/local/src/clusterconfiguration/app.js" ]
