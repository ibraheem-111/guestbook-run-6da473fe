FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Build-time placeholders (overridden at runtime by Railway)
ENV SUPABASE_URL=https://placeholder.supabase.co
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder

# The port Railway will expose
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
