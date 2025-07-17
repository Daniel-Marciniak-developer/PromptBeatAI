FROM node:lts-alpine AS builder
WORKDIR /usr/src/app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 5173
CMD [ "npm", "run", "dev" ]

# FROM nginx:alpine
# COPY nginx.conf /etc/nginx/nginx.conf
# COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
