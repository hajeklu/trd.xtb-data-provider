# Use a Node.js image that matches your development environment
FROM node:16

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy your source code to the container
COPY . .

# Build the application
RUN npm run build

# Expose the port that your Node.js app will run on
EXPOSE 3000

# Start the app
CMD [ "node", "dist/index.js" ]
