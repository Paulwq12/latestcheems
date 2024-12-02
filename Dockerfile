FROM ghcr.io/parkervcp/yolks:nodejs_20

LABEL author="Michael Parker" maintainer="parker@pterodactyl.io"

# Install additional dependencies as root
USER root
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
    npm -g install npm@latest

# Set correct permissions for npm cache
RUN mkdir -p /home/container/.npm && \
    chown -R 1001:1001 /home/container/.npm

# Switch to non-root user and set work directory
USER container
ENV USER=container HOME=/home/container
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
