# Utiliser l'image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installer les dépendances (y compris devDependencies car json-server est dans devDependencies)
RUN npm install

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app

# Changer vers l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Créer le fichier db.json s'il n'existe pas
RUN touch db.json || true

# Commande pour démarrer l'application
CMD ["npm", "run", "api"]