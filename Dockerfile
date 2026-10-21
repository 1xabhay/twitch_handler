# Clean-machine check: tests + types on Node 25. The bot itself runs on the host (OBS, `say`, logins).
FROM node:25-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["sh", "-c", "npm test && npm run typecheck"]
