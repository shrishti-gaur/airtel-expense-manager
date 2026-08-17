FROM node:22-alpine

RUN apk add --no-cache \
    python3 \
    py3-numpy \
    py3-opencv \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-hin

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]