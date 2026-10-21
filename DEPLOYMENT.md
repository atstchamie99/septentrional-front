# Déploiement continu du frontend

Tout push sur la branche `live` déclenche le build puis le déploiement vers
`https://front.septentrional.tg`.

## Configuration GitHub unique

Créer un environnement GitHub nommé `live`, puis y définir :

### Secrets

- `DEPLOY_SSH_PRIVATE_KEY` : clé privée SSH dédiée à GitHub Actions ;
- `DEPLOY_SSH_KNOWN_HOSTS` : ligne `known_hosts` vérifiée du serveur o2switch ;
- `VITE_API_KEY` : clé publique d'application attendue par l'API.

### Variables

- `DEPLOY_HOST` : `hathor.o2switch.net` ;
- `DEPLOY_PORT` : `22` ;
- `DEPLOY_USER` : utilisateur cPanel/o2switch ;
- `DEPLOY_BASE_PATH` : `/home/UTILISATEUR/apps/septentrional-front` ;
- `VITE_API_URL` : `https://api.septentrional.tg/api/v2`.

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
