# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Copy tsconfig.json and other TypeScript-related files
COPY tsconfig*.json ./

# Copy the rest of the application code
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
