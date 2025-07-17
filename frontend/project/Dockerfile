FROM node:lts-alpine AS builder

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 40831 
CMD [ "npm", "run", "dev", "--", "--port", "40831" ]

# FROM nginx:alpine
# COPY nginx.conf /etc/nginx/nginx.conf
# COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
