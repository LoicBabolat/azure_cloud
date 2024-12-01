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

## Architecture
### Back-end

Le back-end est un serveur node JS que j'ai fait avec ExpressJS avec typescript.

### Front-end

Pour le front-end, j'ai utilisé des fichiers ejs utiliser les variables js en html, mais l'organisation du javascript est dans des fichiers typescript à part.