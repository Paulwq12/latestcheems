# Use the Node.js image from Yolks
FROM ghcr.io/parkervcp/yolks:nodejs_20

LABEL author="Michael Parker" maintainer="parker@pterodactyl.io"

# Use root user
USER root

# Install necessary dependencies
RUN apt update && \
    apt -y install \
    ffmpeg \
    iproute2 \
    git \
    sqlite3 \
    libsqlite3-dev \
    python3 \
    python3-dev \
    ca-certificates \
    dnsutils \
    tzdata \
    zip \
    tar \
    curl \
    build-essential && \
    npm install -g npm@latest

# Set working directory
WORKDIR /home/container

# Copy package.json and install Node.js dependencies
COPY package.json .
RUN npm install && npm install qrcode-terminal

# Copy application files
COPY . .

# Expose the application's port
EXPOSE 3000

# Command to run your app
CMD ["node", "index.js", "--server"]
