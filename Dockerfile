FROM node:20-slim

WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY public ./public
COPY vendor ./vendor
COPY README.md LAUNCH_CHECKLIST.md ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4173
ENV DATA_DIR=/data

RUN mkdir -p /data/uploads

EXPOSE 4173
CMD ["node", "server.js"]
