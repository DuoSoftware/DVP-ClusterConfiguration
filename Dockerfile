# VERSION 0.2
# DOCKER-VERSION 0.3.4
# To build:
# 1. Install docker (http://docker.io)
# 2. Checkout source: git@github.com:gasi/docker-node-hello.git
# 3. Build container: docker build .

FROM    ubuntu

RUN apt-get update
# Enable EPEL for Node.js
#RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
# Install Node.js and npm
RUN     apt-get install -y git nodejs npm
RUN     cd /usr/local/src; git clone git://github.com/DuoSoftware/DVP-ClusterConfiguration.git
# App
#ADD . /src
# Install app dependencies
RUN cd usr/local/src/DVP-ClusterConfiguration; npm install


CMD ["nodejs", "usr/local/src/DVP-ClusterConfiguration/app.js"]

EXPOSE 80

