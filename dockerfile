# Sử dụng image chứa Node.js 18
FROM node:18

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libpango-1.0-0 \
    libgbm-dev \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*
    
# Tạo thư mục ứng dụng trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json nếu có và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép các file ứng dụng vào thư mục làm việc
COPY . .

# Mở cổng mặc định của ứng dụng
EXPOSE 3000

# Chạy ứng dụng
CMD ["node", "index.js"]