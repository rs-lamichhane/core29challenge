FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
# Seed real SQL files and start the API
CMD ["sh", "-c", "node dist/seed.js || true; node dist/index.js"]
