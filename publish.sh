#!/bin/bash

set -e

DEV_BRANCH="dev"
PROD_BRANCH="production"
REMOTE="origin"

echo "========================================"
echo "   Publication Git Septentrional"
echo "========================================"
echo

# ============================================================
# FONCTIONS
# ============================================================

error() {
    echo
    echo "❌ ERREUR : $1"
    echo
    exit 1
}

success() {
    echo
    echo "✅ $1"
}

# ============================================================
# 1. VERIFICATION GIT
# ============================================================

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || error "Ce dossier n'est pas un dépôt Git."

# ============================================================
# 2. VERIFICATION BRANCHE
# ============================================================

CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$DEV_BRANCH" ]; then
    error "Tu dois démarrer le script sur la branche '$DEV_BRANCH'. Branche actuelle : $CURRENT_BRANCH"
fi

echo "Branche actuelle : $CURRENT_BRANCH"

# Retour automatique sur DEV en cas d'interruption ou d'erreur
trap 'git checkout "$DEV_BRANCH" >/dev/null 2>&1 || true' EXIT

# ============================================================
# 3. RECUPERATION DES INFORMATIONS DISTANTES
# ============================================================

echo
echo "========================================"
echo " Synchronisation avec GitHub"
echo "========================================"

git fetch "$REMOTE"

success "Informations GitHub récupérées."

# ============================================================
# 4. VERIFICATION DES MODIFICATIONS
# ============================================================

echo
echo "========================================"
echo " Vérification des modifications"
echo "========================================"

if ! git diff --quiet || ! git diff --cached --quiet; then

    echo
    echo "📁 Des modifications locales ont été détectées."
    echo

    git status --short

    echo
    echo "Ajout des fichiers..."
    git add -A

    echo
    read -rp "Message du commit : " MESSAGE

    if [ -z "$MESSAGE" ]; then
        error "Le message du commit est vide."
    fi

    echo
    echo "Création du commit..."
    git commit -m "$MESSAGE"

    success "Commit créé."

else

    echo "ℹ️ Aucune nouvelle modification à commiter."

fi

# ============================================================
# 5. VERIFICATION DEV
# ============================================================

echo
echo "========================================"
echo " Vérification DEV"
echo "========================================"

DEV_AHEAD=$(git rev-list --count "$REMOTE/$DEV_BRANCH..$DEV_BRANCH")
DEV_BEHIND=$(git rev-list --count "$DEV_BRANCH..$REMOTE/$DEV_BRANCH")

echo "Commits locaux non poussés : $DEV_AHEAD"
echo "Commits distants non récupérés : $DEV_BEHIND"

# ------------------------------------------------------------
# DEV derrière GitHub
# ------------------------------------------------------------

if [ "$DEV_BEHIND" -gt 0 ]; then

    echo
    echo "⚠️ La branche DEV locale est derrière GitHub."

    echo
    echo "Commits présents sur GitHub :"
    git log --oneline "$DEV_BRANCH..$REMOTE/$DEV_BRANCH"

    echo
    read -rp "Faire un pull --rebase sur DEV ? [o/N] " RESPONSE

    if [[ "$RESPONSE" =~ ^[oO]$ ]]; then

        git pull --rebase "$REMOTE" "$DEV_BRANCH"

        success "DEV synchronisée avec GitHub."

    else

        error "DEV n'est pas synchronisée avec GitHub."
    fi

fi

# ------------------------------------------------------------
# Push DEV
# ------------------------------------------------------------

DEV_AHEAD=$(git rev-list --count "$REMOTE/$DEV_BRANCH..$DEV_BRANCH")

if [ "$DEV_AHEAD" -gt 0 ]; then

    echo
    echo "📤 Push de DEV vers GitHub..."

    git push "$REMOTE" "$DEV_BRANCH"

    success "DEV envoyée sur GitHub."

else

    echo
    echo "✅ DEV est déjà synchronisée avec GitHub."

fi

# ============================================================
# 6. COMPARAISON DEV / PRODUCTION
# ============================================================

echo
echo "========================================"
echo " Comparaison DEV / PRODUCTION"
echo "========================================"

git fetch "$REMOTE"

DEV_ONLY=$(git rev-list --count "$REMOTE/$PROD_BRANCH..$DEV_BRANCH")
PROD_ONLY=$(git rev-list --count "$DEV_BRANCH..$REMOTE/$PROD_BRANCH")

echo
echo "Commits DEV absents de PRODUCTION : $DEV_ONLY"
echo "Commits PRODUCTION absents de DEV : $PROD_ONLY"

if [ "$DEV_ONLY" -eq 0 ]; then

    echo
    echo "ℹ️ Aucun nouveau commit DEV à fusionner dans PRODUCTION."

    git checkout "$PROD_BRANCH"

    git pull --ff-only "$REMOTE" "$PROD_BRANCH"

    git checkout "$DEV_BRANCH"

    echo
    echo "========================================"
    echo " Publication terminée"
    echo "========================================"
    echo
    echo "DEV        : OK"
    echo "PRODUCTION : déjà à jour"
    echo

    exit 0
fi

# ============================================================
# 7. AFFICHAGE DES COMMITS QUI SERONT FUSIONNES
# ============================================================

echo
echo "Commits DEV qui seront envoyés en PRODUCTION :"
echo

git log --oneline "$REMOTE/$PROD_BRANCH..$DEV_BRANCH"

echo
read -rp "Continuer vers PRODUCTION ? [o/N] " CONFIRM

if [[ ! "$CONFIRM" =~ ^[oO]$ ]]; then

    echo
    echo "⏹ Publication annulée."
    exit 0

fi

# ============================================================
# 8. PASSAGE EN PRODUCTION
# ============================================================

echo
echo "========================================"
echo " Passage sur PRODUCTION"
echo "========================================"

git checkout "$PROD_BRANCH"

# ============================================================
# 9. SYNCHRONISATION PRODUCTION
# ============================================================

echo
echo "Mise à jour de PRODUCTION depuis GitHub..."

git pull --ff-only "$REMOTE" "$PROD_BRANCH"

success "PRODUCTION synchronisée."

# ============================================================
# 10. VERIFICATION AVANT MERGE
# ============================================================

echo
echo "========================================"
echo " Vérification avant Merge"
echo "========================================"

PROD_AHEAD=$(git rev-list --count "$REMOTE/$PROD_BRANCH..$PROD_BRANCH")
PROD_BEHIND=$(git rev-list --count "$PROD_BRANCH..$REMOTE/$PROD_BRANCH")

if [ "$PROD_AHEAD" -gt 0 ] || [ "$PROD_BEHIND" -gt 0 ]; then
    error "PRODUCTION n'est pas synchronisée avec GitHub."
fi

# ============================================================
# 11. MERGE DEV -> PRODUCTION
# ============================================================

echo
echo "========================================"
echo " Merge DEV -> PRODUCTION"
echo "========================================"

git merge "$DEV_BRANCH" --no-ff \
    -m "Merge dev into production"

success "DEV fusionnée dans PRODUCTION."

# ============================================================
# 12. PUSH PRODUCTION
# ============================================================

echo
echo "========================================"
echo " Push PRODUCTION"
echo "========================================"

git push "$REMOTE" "$PROD_BRANCH"

success "PRODUCTION envoyée sur GitHub."

# ============================================================
# 13. RETOUR DEV
# ============================================================

echo
echo "Retour sur DEV..."

git checkout "$DEV_BRANCH"

# ============================================================
# 14. VERIFICATION FINALE
# ============================================================

echo
echo "========================================"
echo " Vérification finale"
echo "========================================"

git fetch "$REMOTE"

DEV_STATUS=$(git rev-list --left-right --count "$REMOTE/$DEV_BRANCH...$DEV_BRANCH")
PROD_STATUS=$(git rev-list --left-right --count "$REMOTE/$PROD_BRANCH...$PROD_BRANCH")

echo
echo "DEV       : origin/dev...dev"
echo "          : $DEV_STATUS"

echo
echo "PRODUCTION : origin/production...production"
echo "           : $PROD_STATUS"

# ============================================================
# 15. RESULTAT
# ============================================================

echo

if [ "$DEV_STATUS" = "0	0" ] && [ "$PROD_STATUS" = "0	0" ]; then

    echo "========================================"
    echo "       ✅ PUBLICATION TERMINÉE"
    echo "========================================"
    echo
    echo "DEV        : synchronisée"
    echo "PRODUCTION : synchronisée"
    echo "GitHub     : synchronisé"
    echo
    echo "Branche actuelle : $(git branch --show-current)"
    echo

else

    echo "========================================"
    echo "⚠️ PUBLICATION TERMINÉE AVEC VÉRIFICATION"
    echo "========================================"
    echo
    echo "Les branches ne sont pas toutes synchronisées."
    echo "Vérifie avec :"
    echo
    echo "git status"
    echo

fi
