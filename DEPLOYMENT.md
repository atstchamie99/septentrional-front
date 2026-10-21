# Déploiement continu du frontend

Tout push sur la branche `live` déclenche le build puis le déploiement vers
`https://front.septentrional.tg`.

## Configuration GitHub unique

Créer un environnement GitHub nommé `live`, puis y définir :

### Secrets

- `DEPLOY_SSH_PRIVATE_KEY` : clé privée SSH dédiée à GitHub Actions ;
- `DEPLOY_SSH_KNOWN_HOSTS` : ligne `known_hosts` vérifiée du serveur o2switch ;
- `CPANEL_API_TOKEN` : jeton API cPanel utilisé pour autoriser temporairement
  l'adresse IP du runner GitHub sur le port SSH ;
- `VITE_API_KEY` : clé publique d'application attendue par l'API.

### Variables

- `DEPLOY_USER` : utilisateur cPanel/o2switch.

L'hôte, le port, le chemin de déploiement et l'URL de l'API sont déjà définis
dans le workflow.

Le jeton se crée dans cPanel avec **Sécurité > Gérer les jetons d'API**. Le
workflow ajoute l'IP du runner à la liste blanche o2switch avant la connexion
SSH, puis la retire à la fin, y compris si le déploiement échoue.

Dans cPanel, la racine de `front.septentrional.tg` doit être :

```text
/home/UTILISATEUR/apps/septentrional-front/current
```

Le certificat AutoSSL du sous-domaine doit être valide avant le premier
déploiement.

## Publier

```bash
git switch live
git merge --ff-only dev
git push origin live
git switch dev
```

## Retour arrière

Dans GitHub, ouvrir **Actions > Restaurer le frontend live > Run workflow** et
saisir le SHA complet d'une ancienne release.
