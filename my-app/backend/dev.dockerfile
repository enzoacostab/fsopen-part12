FROM node:16

WORKDIR /usr/src/server

COPY ./backend .

RUN npm install

CMD npm run dev