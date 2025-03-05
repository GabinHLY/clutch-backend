# Utiliser une image officielle Node.js basée sur Alpine pour la légèreté
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de configuration npm (package.json et package-lock.json si présent)
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier l'ensemble du code de l'application dans le conteneur
COPY . .

# Exposer le port sur lequel ton application écoute (par exemple, 3000)
EXPOSE 3000

# Démarrer l'application via la commande définie dans le package.json ("start": "node server.js")
CMD ["npm", "start"]
