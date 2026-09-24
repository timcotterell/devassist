FROM node:24-alpine
WORKDIR /app
COPY services/catalog/package.json ./package.json
RUN npm install
COPY services/catalog/src ./src
CMD ["npm", "start"]
