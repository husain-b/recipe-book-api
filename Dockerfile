ARG NODE_VERSION=18.12.1
FROM node:${NODE_VERSION}-alpine as builder
# RUN apk update && apk add python3-dev make alpine-sdk gcc g++ git build-base openssh openssl bash
# RUN ssh-keyscan -t rsa gitlab.com >> ~/.ssh/known_hosts
RUN mkdir /srv/rc-book
WORKDIR /srv/rc-book
COPY ./package.json .
RUN npm install
COPY . .
# RUN git rev-parse HEAD > gitsha && rm -rf .git
FROM node:${NODE_VERSION}-alpine
RUN mkdir /srv/rc-book
WORKDIR /srv/rc-book
COPY --from=builder /srv/rc-book .
ENTRYPOINT ["node" ,"/srv/rc-book/src/index.js"]