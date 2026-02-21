# Dockerfile pour Backend Fresha Clone
FROM node:18-alpine

# Definir le repertoire de travail
WORKDIR /app

# Copier les fichiers de dependances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dependances pour compiler TypeScript
RUN npm ci

# Copier le reste du code
COPY . .

# Generer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# Supprimer les dependances de developpement pour l'image finale
RUN npm prune --omit=dev

# Exposer le port
EXPOSE 5000

# Variables d'environnement par defaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de demarrage
CMD ["npm", "start"]

