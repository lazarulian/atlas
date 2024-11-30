# Use the official Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Initialize the Migrations
RUN npm run migration:run

ENV TZ=America/Los_Angeles
RUN apk add --no-cache tzdata

# Expose the port your app runs on
EXPOSE 4000

# Start the application
CMD ["node", "build/index.js"]
