# Stage 1: Build the Angular app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default
# RUN rm /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist/dheevidhya/browser /usr/share/nginx/html

# Copy custom Nginx config if needed (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

ADD nginx.conf .

EXPOSE 80

CMD [“/bin/sh”, “-c”, “envsubst < nginx.conf > /etc/nginx/conf.d/default.conf && nginx -g ‘daemon off;’”]
 