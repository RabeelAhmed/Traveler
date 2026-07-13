# Use Node.js 20 Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package configurations first to leverage layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY . .

# Expose port 3000 as required
EXPOSE 3000

# Start the server using npm start
CMD ["npm", "start"]
