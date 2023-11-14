FROM node:16

WORKDIR /usr/src/app

COPY ./frontend .

RUN npm install

CMD [ "npm", "start" ]