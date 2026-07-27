FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
# Bound to 0.0.0.0 inside the container only; the port publish in
# docker-compose pins it to 127.0.0.1 on the host, same as the members auth service.
CMD ["gunicorn", "-b", "0.0.0.0:8092", "-w", "2", "app:app"]
