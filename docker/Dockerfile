FROM public.ecr.aws/lambda/nodejs:20

RUN dnf repolist --enabled
RUN dnf install -y automake findutils g++ gcc git gzip make maven python3.11 python3.11-pip tar unzip which wget
RUN git config --global user.email "pdk@build.com" && git config --global user.name "PDK Build Job"
RUN ln -sf /usr/bin/python3.11 /usr/bin/python
ENV LD_LIBRARY_PATH=""

# NPM Dependencies
RUN npm install -g @aws/pdk aws-cdk bun pnpm projen yarn

# Poetry setup
RUN curl -sSL https://install.python-poetry.org | python
ENV PATH="/root/.local/bin:$PATH"

# JDK
RUN dnf -y install java-17-amazon-corretto-devel

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

CMD ["/bin/bash"]