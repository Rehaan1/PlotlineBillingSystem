FROM node:18-alpine

RUN apk update && apk add --no-cache npm

ENV PORT=3001

WORKDIR /app

EXPOSE 3001

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY --chown=node:node . .

USER node

CMD ["node", "app.js"]