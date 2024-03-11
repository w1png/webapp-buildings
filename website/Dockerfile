FROM node:alpine AS tailwind
WORKDIR /app
COPY ./tailwind.config.js /app/tailwind.config.js
COPY ./templates /app/templates
COPY ./static /app/static
RUN npm install -g tailwindcss
RUN tailwindcss -i ./static/style.css -o ./static/output.css --minify


FROM golang:1.22-bullseye AS builder
WORKDIR /app

RUN apt-get update
RUN apt-get install -y libvips-dev

RUN go install github.com/a-h/templ/cmd/templ@latest
RUN templ generate

COPY . .

RUN go mod download

COPY --from=tailwind /app/static /app/static
RUN go build -o server .

ENV JWT_SECRET=NO_SECRET
ENV STORAGE_TYPE=sqlite
ENV TELEGRAM_TOKEN=7082254683:AAEIznPOVr7GdTnVouy5wc-F3see82qbuc4
ENV MAIN_ADMIN_ID=772316661
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["./server"]
