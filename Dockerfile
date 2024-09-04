FROM node

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
COPY yarn.lock /app
COPY . /app
RUN yarn

# Bundle app source
RUN yarn build

EXPOSE 3000
CMD [ "yarn", "start" ]
