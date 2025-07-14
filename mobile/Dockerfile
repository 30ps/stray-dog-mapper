# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Global installations are not recommended; dependencies will be in package.json

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Install required Expo packages
RUN npx expo install expo-constants expo-location expo-permissions

# Copy the rest of the application code to the working directory
COPY . .

# Expose the ports used by Expo
EXPOSE 19006
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# The command to start the app will be provided by docker-compose
CMD ["npx", "expo", "start", "--lan"]
