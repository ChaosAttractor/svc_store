ARG IMAGE_NODE

FROM $IMAGE_NODE AS build
USER node
WORKDIR /usr/src/app/
COPY --chown=node:node ./app/node_modules/ ./node_modules/
COPY --chown=node:node ./app/src/ ./src/
COPY --chown=node:node ./app/package*.json ./
COPY --chown=node:node ./app/nest-cli.json ./
COPY --chown=node:node ./app/tsconfig*.json ./
RUN npm run build
ENV NODE_ENV production
RUN npm prune --only=production

FROM $IMAGE_NODE
USER node
WORKDIR /usr/src/app/
COPY --chown=node:node --from=build /usr/src/app/node_modules/ ./node_modules/
COPY --chown=node:node --from=build /usr/src/app/dist/ ./dist/
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/nest-cli.json ./
COPY --chown=node:node --from=build /usr/src/app/tsconfig*.json ./
ENV NODE_ENV production
CMD ["node", "./dist/main.js"]
