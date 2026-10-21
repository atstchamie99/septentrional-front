# Déploiement continu du frontend

Un push sur `live` lance les contrôles GitHub Actions. Le cron installé sur
o2switch consulte ensuite GitHub et ne déploie que les commits dont le workflow
`deploy-live.yml` est terminé avec succès.

Le script central d'installation et de déploiement se trouve dans le dépôt API,
sous `deploy/o2switch/`.

La racine cPanel de `front.septentrional.tg` doit être :

```text
/home/nopr7308/apps/septentrional-front/current
```
