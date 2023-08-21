FROM node:18-alpine

RUN apk update && apk add --no-cache npm

ENV PORT=4001

WORKDIR /app

EXPOSE 4001

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY --chown=node:node . .

USER node

CMD ["node", "app.js"]