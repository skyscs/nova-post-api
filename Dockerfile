FROM oven/bun:1-alpine as base

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Copy schema.sql to dist directory for migrations
RUN mkdir -p dist/database
RUN cp src/database/schema.sql dist/database/schema.sql

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3002

# Run the application
CMD ["bun", "run", "start"] 