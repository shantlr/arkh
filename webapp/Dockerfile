FROM alpine AS deps

RUN apk --update add jq && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

COPY package.json pkg.json
RUN cat pkg.json | jq "{ dependencies, devDependencies }" > package.json



FROM node:16-alpine AS install

USER node
WORKDIR /home/node

COPY --from=deps package.json .
COPY yarn.lock .

RUN yarn install && yarn cache clean && rm -rf .cache && rm -rf .yarn


FROM install AS dev

USER node
WORKDIR /home/node

COPY src ./src
COPY public ./public
COPY .prettierrc ./.prettierrc
COPY tailwind.config.js ./tailwind.config.js
COPY craco.config.js ./craco.config.js
COPY jsconfig.json ./jsconfig.json
COPY package.json ./package.json

CMD ["yarn", "start"]