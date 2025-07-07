  FROM node:18-alpine

  # Install FFmpeg
  RUN apk add --no-cache ffmpeg

  # Set working directory
  WORKDIR /app

  # Copy package files
  COPY package*.json ./

  # Install dependencies
  RUN npm install --only=production

  # Copy source code
  COPY . .

  # Create required directories
  RUN mkdir -p downloads temp logs

  # Expose port
  EXPOSE 3001

  # Start application
  CMD ["npm", "start"]
