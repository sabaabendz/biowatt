FROM node:20-bookworm-slim

WORKDIR /app

# Install build dependencies for better-sqlite3 if needed
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=4000
ENV DB_PATH=/data/biowatt.db
ENV MQTT_BROKER_URL=mqtt://mosquitto:1883

EXPOSE 4000

CMD ["node", "src/server.js"]

