FROM ghcr.io/parkervcp/yolks:nodejs_20

LABEL author="Michael Parker" maintainer="parker@pterodactyl.io"

# Install additional dependencies
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

# Set work directory and switch to non-root user
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
