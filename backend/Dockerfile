FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --only=production=false

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Crear directorio de uploads
RUN mkdir -p uploads

EXPOSE 3000

# Ejecutar migraciones y arrancar
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
