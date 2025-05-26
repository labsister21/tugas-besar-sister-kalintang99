FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

ENV CHOKIDAR_USEPOLLING=true

CMD ["sh", "-c", "nodemon --exec ts-node -r tsconfig-paths/register src/index.ts --id=$ID --port=$PORT --peers=$PEERS"]

