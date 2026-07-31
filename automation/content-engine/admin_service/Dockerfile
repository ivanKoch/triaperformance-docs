FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

# Runs with `docker run --network host`, which is required rather than cosmetic:
# analytics-postgres is bound to 127.0.0.1 on the host, so a container on the
# default bridge network cannot reach it at all — not via 172.17.0.1, not via
# the container name. Sharing the host network namespace is the simplest way in
# without loosening the database's binding.
#
# Because of that, binding 127.0.0.1 here is load-bearing: with --network host,
# 0.0.0.0 would publish this admin page on the VPS's public IP. Caddy reaches it
# on loopback and handles auth; nothing else should be able to.
CMD ["gunicorn", "-b", "127.0.0.1:8092", "-w", "2", "app:app"]
