# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy server code
COPY server ./server

# Move into server directory
WORKDIR /app/server

# Install dependencies
RUN npm install

# Open Railway port (default)
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
