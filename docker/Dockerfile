FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# Install SSH and other utilities
RUN set -ex \
    && dnf install -y openssh-clients \
    && mkdir ~/.ssh \
    && touch ~/.ssh/known_hosts \
    && ssh-keyscan -t rsa,dsa -H github.com >> ~/.ssh/known_hosts \
    && ssh-keyscan -t rsa,dsa -H bitbucket.org >> ~/.ssh/known_hosts \
    && chmod 600 ~/.ssh/known_hosts \
    && dnf install docker -y \
    && dnf install -y gzip jq openssl openssl-devel tar wget which sudo unzip make gettext gcc curl-devel expat-devel iptables \
    && dnf install -y bzip2-devel libffi-devel ncurses-devel readline-devel sqlite-devel xz-devel zlib-devel libicu procps-ng

# Install Git
RUN set -ex \
   && GIT_VERSION=2.43.0 \
   && GIT_TAR_FILE=git-$GIT_VERSION.tar.gz \
   && GIT_SRC=https://github.com/git/git/archive/v${GIT_VERSION}.tar.gz  \
   && curl -L -o $GIT_TAR_FILE $GIT_SRC \
   && tar zxvf $GIT_TAR_FILE \
   && cd git-$GIT_VERSION \
   && make -j4 prefix=/usr \
   && make install prefix=/usr \
   && cd .. ; rm -rf git-$GIT_VERSION \
   && rm -rf $GIT_TAR_FILE /tmp/*

# Install AWS CLI v2
# https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
RUN curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /opt \
    && /opt/aws/install --update -i /usr/local/aws-cli -b /usr/local/bin \
    && rm /tmp/awscliv2.zip \
    && rm -rf /opt/aws \
    && aws --version

# Install AWS Copilot CLI
# https://aws.github.io/copilot-cli/docs/getting-started/install/
RUN curl -Lo copilot https://github.com/aws/copilot-cli/releases/download/v1.32.1/copilot-linux && chmod +x copilot && sudo mv copilot /usr/local/bin/copilot \
    && dnf install -y dirmngr --allowerasing \
    && gpg --keyserver hkps://keyserver.ubuntu.com --recv BCE9D9A42D51784F \
    && sudo curl -Lo copilot.asc https://github.com/aws/copilot-cli/releases/download/v1.32.1/copilot-linux.asc \
    && gpg --verify copilot.asc /usr/local/bin/copilot \
    && rm -rf copilot.asc

# Install nodejs
ENV NODE_VERSION="v18.19.0"

RUN wget https://nodejs.org/download/release/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.gz -O /tmp/nodejs.tar.gz \
    && tar -xvf /tmp/nodejs.tar.gz --directory /usr/local --strip-components 1 \
    && npm config --global set prefix /usr/local/npm \
    && rm -fr /tmp/node*

ENV PATH="/usr/local/npm/bin:$PATH"

# Pre-Build Step - Test Reporting Package
RUN npm install -g @aws/universal-test-runner

# Install Java
ENV JAVA_17_HOME="/usr/lib/jvm/java-17-amazon-corretto.x86_64" \
    JDK_17_HOME="/usr/lib/jvm/java-17-amazon-corretto.x86_64" \
    JRE_17_HOME="/usr/lib/jvm/java-17-amazon-corretto.x86_64" \
    MAVEN_HOME="/opt/maven" \
    MAVEN_VERSION=3.9.6 \
    INSTALLED_GRADLE_VERSIONS="8.5" \
    GRADLE_VERSION=8.5 \
    GRADLE_PATH="$SRC_DIR/gradle" \
    MAVEN_DOWNLOAD_SHA512="706f01b20dec0305a822ab614d51f32b07ee11d0218175e55450242e49d2156386483b506b3a4e8a03ac8611bae96395fd5eec15f50d3013d5deed6d1ee18224" \
    GRADLE_DOWNLOADS_SHA256="c16d517b50dd28b3f5838f0e844b7520b8f1eb610f2f29de7e4e04a1b7c9c79b 8.5"

ARG MAVEN_CONFIG_HOME="/root/.m2"
ENV JAVA_HOME="$JAVA_17_HOME" \
    JDK_HOME="$JDK_17_HOME" \
    JRE_HOME="$JRE_17_HOME"

# Install Amazon Corretto 17
RUN set -x \
    && yum install -y java-17-amazon-corretto \
    && yum install -y java-17-amazon-corretto-devel \
    && rm $JAVA_HOME/lib/security/cacerts && ln -s /etc/pki/java/cacerts $JAVA_HOME/lib/security/cacerts

# Install Maven
RUN set -ex \
    && mkdir -p $MAVEN_HOME \
    && curl -LSso /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz https://downloads.apache.org/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.tar.gz \
    && echo "$MAVEN_DOWNLOAD_SHA512 /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz" | sha512sum -c - \
    && tar xzvf /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz -C $MAVEN_HOME --strip-components=1 \
    && rm /var/tmp/apache-maven-$MAVEN_VERSION-bin.tar.gz \
    && update-alternatives --install /usr/bin/mvn mvn /opt/maven/bin/mvn 10000 \
    && mkdir -p $MAVEN_CONFIG_HOME \
    # Install Gradle
    && mkdir -p $GRADLE_PATH \
    && for version in $INSTALLED_GRADLE_VERSIONS; do { \
       wget -nv "https://services.gradle.org/distributions/gradle-$version-all.zip" -O "$GRADLE_PATH/gradle-$version-all.zip" \
       && unzip "$GRADLE_PATH/gradle-$version-all.zip" -d /usr/local \
       && echo -e "$GRADLE_DOWNLOADS_SHA256" | grep "$version" | sed "s|$version|$GRADLE_PATH/gradle-$version-all.zip|" | sha256sum -c - \
       && rm "$GRADLE_PATH/gradle-$version-all.zip" \
       && if [ "$version" != "$GRADLE_VERSION" ]; then rm -rf "/usr/local/gradle-$version"; fi; \
     }; done \
    # Install default GRADLE_VERSION to path
    && ln -s /usr/local/gradle-$GRADLE_VERSION/bin/gradle /usr/bin/gradle \
    && rm -rf $GRADLE_PATH

# Install Python
RUN curl https://pyenv.run | bash
ENV PATH="/root/.pyenv/shims:/root/.pyenv/bin:$PATH"

ENV PYTHON_VERSION="3.11.6"
ENV PYTHON_PIP_VERSION=22.3.1
ENV PYYAML_VERSION=6.0
ENV PYTHON_SETUP_TOOLS_VERSION=67.6.0

RUN sudo ls -alrt /root
RUN cat /root/.pyenv/plugins/python-build/share/python-build/$PYTHON_VERSION
RUN env PYTHON_CONFIGURE_OPTS="--enable-shared --enable-loadable-sqlite-extensions" pyenv install $PYTHON_VERSION && rm -rf /tmp/*
RUN pyenv global  $PYTHON_VERSION
RUN set -ex \
    && pip3 install --no-cache-dir --upgrade --force-reinstall "pip==$PYTHON_PIP_VERSION" \
    && pip3 install --no-cache-dir --upgrade "PyYAML==$PYYAML_VERSION" \
    && pip3 install --no-cache-dir --upgrade "setuptools==$PYTHON_SETUP_TOOLS_VERSION" wheel aws-sam-cli boto3 pipenv virtualenv

# Install Dotnet
ENV PATH="/root/.dotnet/:/root/.dotnet/tools/:$PATH"
RUN set -ex  \
    && wget -qO /usr/local/bin/dotnet-install.sh https://dot.net/v1/dotnet-install.sh \
    && chmod +x /usr/local/bin/dotnet-install.sh

ENV DOTNET_SDK_VERSION="8.0.100"
ENV DOTNET_ROOT="/root/.dotnet"

# Add .NET Core 6.0 Global Tools install folder to PATH
RUN /usr/local/bin/dotnet-install.sh -v $DOTNET_SDK_VERSION \
    && dotnet --list-sdks \
    && rm -rf /tmp/*

# Install GoLang
RUN git clone https://github.com/syndbg/goenv.git $HOME/.goenv
ENV PATH="/root/.goenv/shims:/root/.goenv/bin:/go/bin:$PATH"
ENV GOENV_DISABLE_GOPATH=1
ENV GOPATH="/go"
ENV GOLANG_VERSION="1.21.5"

RUN goenv install $GOLANG_VERSION && rm -rf /tmp/* && \
    goenv global  $GOLANG_VERSION && \
    go env -w GO111MODULE=auto

RUN go get -u github.com/golang/dep/cmd/dep

# Cleanup
RUN rm -fr /tmp/* /var/tmp/*

# Install Docker
ENV DOCKER_BUCKET="download.docker.com" \
    DOCKER_CHANNEL="stable" \
    DIND_COMMIT="3b5fac462d21ca164b3778647420016315289034"

ENV DOCKER_SHA256="692ecfc28333485d184f628b74c25b2894cee9495a51a5418ba60ef95bf733ca"
ENV DOCKER_VERSION="24.0.9"
ENV DOCKER_COMPOSE_VERSION="v2.23.3"

VOLUME /var/lib/docker

RUN set -ex \
    && curl -fSL "https://${DOCKER_BUCKET}/linux/static/${DOCKER_CHANNEL}/x86_64/docker-${DOCKER_VERSION}.tgz" -o docker.tgz \
    && echo "${DOCKER_SHA256} *docker.tgz" | sha256sum -c - \
    && tar --extract --file docker.tgz --strip-components 1  --directory /usr/local/bin/ \
    && rm docker.tgz \
    && docker -v \
    # set up subuid/subgid so that "--userns-remap=default" works out-of-the-box
    && groupadd dockremap \
    && useradd -g dockremap dockremap \
    && echo 'dockremap:165536:65536' >> /etc/subuid \
    && echo 'dockremap:165536:65536' >> /etc/subgid \
    && wget -q "https://raw.githubusercontent.com/docker/docker/${DIND_COMMIT}/hack/dind" -O /usr/local/bin/dind  \
    && curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" > /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/dind /usr/local/bin/docker-compose \
    # Ensure docker-compose works
    && docker-compose version

# ===== PDK dependencies =====

# Package managers
RUN npm install -g @aws/pdk aws-cdk bun pnpm@8 projen yarn

# Poetry setup
RUN curl -sSL https://install.python-poetry.org | python
ENV PATH="/root/.local/bin:$PATH"

# Graphviz
RUN dnf -y install graphviz

# License Finder
RUN dnf -y install rubygems ruby
RUN gem install license_finder

# Open API Generator
RUN mkdir -p ~/.open-api-generator-cli
RUN curl https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/6.3.0/openapi-generator-cli-6.3.0.jar -o ~/.open-api-generator-cli/6.3.0.jar
RUN curl https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/7.1.0/openapi-generator-cli-7.1.0.jar -o ~/.open-api-generator-cli/7.1.0.jar
RUN curl https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/6.6.0/openapi-generator-cli-6.6.0.jar -o ~/.open-api-generator-cli/6.6.0.jar

# =====================================

# Entrypoint script
ADD ./dockerd-entrypoint.sh /

ENTRYPOINT ["/dockerd-entrypoint.sh"]
CMD ["sleep", "infinity"]
