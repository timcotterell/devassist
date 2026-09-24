FROM node:24-alpine
WORKDIR /app
COPY services/gateway/package.json ./package.json
RUN npm install
COPY services/gateway/src ./src
CMD ["npm", "start"]
