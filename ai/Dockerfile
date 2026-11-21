FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV MQTT_BROKER=mosquitto
ENV MQTT_PORT=1883
ENV TWIN=0

CMD ["python", "-u", "service.py"]

