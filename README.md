### **README pour Clutch Backend**  

# 🏆 Clutch Backend – API pour le suivi et les paris e-sportifs  

🚀 **Clutch Backend** est l’API qui alimente l’application **Clutch**, permettant de **suivre les compétitions e-sport en temps réel** et de **gérer un système de paris avec jetons virtuels**. Ce backend assure la communication avec les bases de données et les services externes pour offrir une expérience fluide et sécurisée aux utilisateurs.  

## 🎯 Fonctionnalités  

- 📅 **Gestion des matchs et compétitions e-sport**  
- 🔴 **Mises à jour en temps réel des scores et résultats**  
- 💰 **Système de paris avec jetons virtuels**  
- 🏆 **Classements des joueurs et historique des paris**  
- 🔒 **Authentification et gestion des utilisateurs**  

## 🛠 Stack technique  

- ⚙️ **Backend** : Node.js avec Express
- 🗄 **Base de données** : MySQL 
- 🔗 **API externe** : Intégration avec les données e-sportives (Liquipedia, Pandascore)  
- 🛡 **Sécurité** : JWT pour l’authentification, rate limiting  
- 📡 **WebSockets** : Mises à jour en temps réel  

## 🚀 Installation  

1️⃣ **Cloner le dépôt**  
```bash
git clone https://github.com/GabinHLY/clutch-backend.git
cd clutch-backend
```
2️⃣ **Installer les dépendances**  
```bash
npm install
```
3️⃣ **Configurer l’environnement**  
Créer un fichier **.env** et ajouter les variables nécessaires :  
```env
DATABASE_URL=mysql://user:password@localhost:3306/clutch
JWT_SECRET=your_secret_key
API_KEY_ESPORT=your_api_key
```
4️⃣ **Lancer le serveur**  
```bash
npm start
```
➡️ L’API est accessible sur **http://localhost:3000**  

## 🔥 Évolutions prévues  

📌 **Prochaines fonctionnalités** :  
- ⏳ **Automatisation des mises à jour de matchs** via cron jobs  
- 🔔 **Système de notifications pour les utilisateurs**  
- 📊 **Analyse avancée des paris et statistiques des joueurs**  

## 🤝 Contribution  

Les contributions sont les bienvenues ! 🚀  
- **Signalez un bug** via une issue.  
- **Proposez des améliorations** via une pull request.  

## 👤 Développeur  

**Gabin DUBOC** – [GitHub](https://github.com/GabinHLY)  