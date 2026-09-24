FROM node:24-alpine
WORKDIR /app
COPY services/support/package.json ./package.json
RUN npm install
COPY services/support/src ./src
CMD ["npm", "start"]
