FROM ubuntu
RUN apt-get update
RUN apt-get install -y git nodejs npm
RUN git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git /usr/local/src/clusterconfiguration
RUN cd usr/local/src/clusterconfiguration; npm install
CMD ["/bin/bash"]

EXPOSE 8805

