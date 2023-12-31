FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --ignore-scripts

COPY . .
RUN yarn && \ 
  yarn build

ENTRYPOINT ["yarn", "start"]
