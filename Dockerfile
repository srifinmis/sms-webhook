# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Expose the application port (adjust if necessary)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]  # Change this if using a different entry file
