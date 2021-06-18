FROM node:16-alpine

RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install 

EXPOSE 4000
CMD npm start
