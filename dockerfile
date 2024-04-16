# Sử dụng image chứa Node.js 18
FROM node:18

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