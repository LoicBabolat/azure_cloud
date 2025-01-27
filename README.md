## Instruction  
### Utilisation en local
Lors de l'utilisation du projet en local, utiliser les commande ci-dessous  

Pour installer les dépendances :  

    npm install
Lancer le serveur en local avec : 

    npm run dev
    
### Déploiement du serveur 

Avant de déployer sur le serveur, il faut transpiler le typescript en javascript avec la commande :

    npm run build

Puis pour lancer le serveur :

    npm run serve

## Le Projet
Le but de ce projet était de concevoir et de mettre en œuvre une solution cloud à petite échelle en utilisant Microsoft Azure. Pour ce faire, j'ai intégré trois services Azure : Azure Web App, Azure MySQL Database, et Azure Blob Storage. L'objectif était de démontrer comment ces services peuvent travailler ensemble pour fournir une solution cohérente et fonctionnelle.

### Architecture du Projet

L'architecture de mon projet se compose des éléments suivants :

1. **Azure Web App** : Héberge l'application web.
2. **Azure MySQL Database** : Stocke les informations des utilisateurs et les métadonnées des vidéos et des fichiers de miniatures.
3. **Azure Blob Storage** : Stocke les fichiers vidéo et les miniatures.

#### Intégration des Services

- **Azure Web App** : L'application web est hébergée sur Azure Web App. Elle sert d'interface utilisateur pour interagir avec les autres services.
- **Azure MySQL Database** : La base de données MySQL stocke les informations des utilisateurs ainsi que les noms des vidéos et des fichiers de miniatures. Ces informations sont récupérées lors des appels API et utilisées pour accéder aux fichiers stockés dans Azure Blob Storage.
- **Azure Blob Storage** : Les fichiers vidéo et les miniatures sont stockés dans Azure Blob Storage. Les noms de ces fichiers sont récupérés de la base de données MySQL et utilisés pour accéder aux fichiers dans le stockage Blob.

#### Technologies Utilisées

- **Express.js** : Utilisé pour créer l'application web et gérer les routes.
- **Prisma** : ORM utilisé pour interagir avec la base de données MySQL.
- **Azure SDK for JavaScript** : Utilisé pour interagir avec Azure Blob Storage.

#### Front-end

Pour le front-end, j'ai utilisé des fichiers ejs utiliser les variables js en html, mais l'organisation du javascript est dans des fichiers typescript à part.
