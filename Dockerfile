# Use the Node.js LTS image
FROM node:lts

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port (default is 5000)
EXPOSE 5000

# Start the application in production mode
CMD ["npm", "start"]