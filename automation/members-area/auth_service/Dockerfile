FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

EXPOSE 8091
# Bound to 127.0.0.1 explicitly -- with network_mode: host (see docker-compose),
# 0.0.0.0 here would mean reachable on the VPS's public interfaces too, not just
# loopback. Must stay 127.0.0.1.
CMD ["gunicorn", "-w", "2", "-b", "127.0.0.1:8091", "app:app"]
