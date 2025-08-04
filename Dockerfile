# Stage 1: Build the Angular app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build the app in production mode
RUN npm run build -- --configuration production

# Stage 2: Serve app with Nginx
FROM nginx:alpine

# Copy built files from build stage to Nginx html folder
COPY --from=build /app/dist/dheevidhya/browser /usr/share/nginx/html

# Copy custom Nginx config if needed (optional)
COPY /nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
# EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
