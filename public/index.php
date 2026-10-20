<?php
/**
 * SEO Proxy pour SPA React/Vite — Septentrional
 * 
 * Ce script intercepte les requêtes. 
 * Les métadonnées SEO sont intégrées au HTML Vite pour tous les visiteurs,
 * y compris les robots sociaux. Les assets restent ceux du build courant.
 */

$apiBaseUrl = getenv('SEPTENTRIONAL_API_URL') ?: 'https://api.septentrional.tg/api/v2/seo';
$siteUrl = getenv('SEPTENTRIONAL_SITE_URL') ?: 'https://www.septentrional.tg';
$indexFile  = __DIR__ . '/index.html';

// Clé API exigée par le backend sur toutes les routes /api/v2/*, y compris
// /seo/*. Pas un secret (même principe que VITE_API_KEY, déjà en clair dans
// .env.production) : elle finit de toute façon dans le bundle JS public.
// SEPTENTRIONAL_API_KEY est fournie par l'environnement Apache/PHP-FPM.
// Aucun identifiant hérité de l'ancien site n'est utilisé par défaut.
$apiKey = getenv('SEPTENTRIONAL_API_KEY') ?: '';

if ($apiKey === '') {
    // Sans clé, l'API rejette (401) tous les appels /seo/* : les aperçus
    // envoyés aux robots sociaux (WhatsApp, Facebook, X...) tombent alors en
    // erreur silencieuse (503 générique) sans qu'aucune alerte ne prévienne.
    // On journalise (au plus 1x/heure, pas à chaque requête) pour qu'un
    // opérateur remarque la mauvaise config serveur.
    $warningMarker = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'septentrional-seo-proxy-missing-key.warned';
    if (!is_file($warningMarker) || filemtime($warningMarker) < time() - 3600) {
        error_log('[septentrional-seo-proxy] SEPTENTRIONAL_API_KEY absente : les aperçus SEO pour les robots sociaux vont échouer.');
        @touch($warningMarker);
    }
}

if (!file_exists($indexFile)) {
    http_response_code(500);
    die('index.html introuvable. Lancez npm run build.');
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = '/' . trim($path, '/');
// Les anciens permaliens WordPress restent utilisables après publication.
if ($apiKey !== '' && preg_match('~^/(?:[0-9]{4}/[0-9]{2}/[0-9]{2}/|category/|3d-flip-book/|dflip/|wpgp_youtube_gallery/)~', $path)) {
    $legacyUrl = preg_replace('~/seo/?$~', '', $apiBaseUrl) . '/legacy/resolve?path=' . rawurlencode($path);
    $legacyCurl = curl_init($legacyUrl);
    curl_setopt_array($legacyCurl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'X-API-Key: ' . $apiKey],
    ]);
    $legacyResponse = curl_exec($legacyCurl);
    $legacyStatus = curl_getinfo($legacyCurl, CURLINFO_HTTP_CODE);
    curl_close($legacyCurl);
    $destination = $legacyStatus === 200 ? (json_decode($legacyResponse ?: '', true)['data']['path'] ?? null) : null;
    if (is_string($destination) && preg_match('~^/(?:article/|pages/|categorie/|a-propos$|contact$|mentions-legales$)[a-zA-Z0-9%_/-]*$~D', $destination)) {
        header('Location: ' . rtrim($siteUrl, '/') . $destination, true, 301);
        exit;
    }
}

$userAgent = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');

// Détection des robots sociaux (WhatsApp, Meta/Facebook, X, LinkedIn, etc.).
$isBot = (bool) preg_match(
    '/(facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher|whatsapp|twitterbot|xbot|telegrambot|linkedinbot|slackbot|discordbot|pinterestbot|vkshare|viber|skypeuripreview|googlebot|bingbot|yandexbot|baiduspider|applebot)/i',
    $userAgent,
);

/** @return array<string, array{title: string, description: string, h1: string}> */
function mainSeoPages(): array
{
    return [
        '/' => [
            'title' => 'Septentrional — Actualités du Togo',
            'description' => "Retrouvez l'actualité, les informations et les vidéos du Togo avec Septentrional.",
            'h1' => 'Septentrional : actualités et informations au Togo',
        ],
        '/actualites' => [
            'title' => 'Actualités du Togo | Septentrional',
            'description' => 'Suivez les dernières actualités, analyses et informations du Togo avec Septentrional.',
            'h1' => 'Actualités du Togo',
        ],
        '/videos' => [
            'title' => 'Vidéos | Septentrional',
            'description' => 'Retrouvez les reportages, interviews et vidéos de Septentrional.',
            'h1' => 'Vidéos Septentrional',
        ],
        '/communiques' => [
            'title' => 'Communiqués | Septentrional',
            'description' => 'Consultez les communiqués publiés par Septentrional.',
            'h1' => 'Communiqués',
        ],
        '/politique' => [
            'title' => 'Actualités politiques du Togo | Septentrional',
            'description' => "Suivez l'actualité politique du Togo avec les articles de Septentrional.",
            'h1' => 'Actualités politiques du Togo',
        ],
        '/autres-rubriques' => [
            'title' => 'Autres rubriques | Septentrional',
            'description' => 'Explorez les autres rubriques et actualités de Septentrional.',
            'h1' => 'Autres rubriques',
        ],
    ];
}

function escapeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** @param array{title: string, description: string, h1: string} $page */
function renderSeoShell(string $indexFile, string $siteUrl, string $path, array $page, int $status = 200): void
{
    $pageNumber = isset($_GET['page']) ? (string) $_GET['page'] : '';
    $hasPagination = $path === '/actualites' && ctype_digit($pageNumber) && (int) $pageNumber > 1;
    $canonicalPath = $path . ($hasPagination ? '?page=' . $pageNumber : '');
    $canonical = rtrim($siteUrl, '/') . ($canonicalPath === '/' ? '/' : $canonicalPath);
    $pageLabel = $hasPagination ? ' — Page ' . $pageNumber : '';
    $title = escapeHtml($page['title'] . $pageLabel);
    $description = escapeHtml($page['description']);
    $h1 = escapeHtml($page['h1'] . $pageLabel);
    $robots = $status === 404 ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    $canonicalTag = $status === 404 ? '' : '<link rel="canonical" href="' . escapeHtml($canonical) . '">';

    $seoTags = <<<HTML
    <title>{$title}</title>
    <meta name="description" content="{$description}">
    <meta name="robots" content="{$robots}">
    {$canonicalTag}
    <meta property="og:type" content="website">
    <meta property="og:url" content="{$canonical}">
    <meta property="og:site_name" content="Septentrional">
    <meta property="og:locale" content="fr_FR">
    <meta property="og:title" content="{$title}">
    <meta property="og:description" content="{$description}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{$title}">
    <meta name="twitter:description" content="{$description}">
    <meta name="twitter:site" content="@Septentrional">
    HTML;

    $html = file_get_contents($indexFile);
    if ($html === false) {
        http_response_code(500);
        exit('index.html introuvable.');
    }

    $snapshot = '<main><h1>' . $h1 . '</h1><p>' . $description . '</p></main>';
    $html = mergeSeoHtml($html, $seoTags, $snapshot);

    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=300, stale-while-revalidate=600');
    echo $html;
    exit;
}

/** Conserver les assets Vite et laisser Helmet remplacer les balises à la navigation. */
function mergeSeoHtml(string $html, string $seoTags, string $snapshot): string
{
    $html = preg_replace('/<title\b[^>]*>.*?<\/title>/is', '', $html) ?? $html;
    $html = preg_replace(
        '/\s*<(?:meta|link)\b(?=[^>]*(?:name|property|rel)=["\'](?:description|robots|canonical|og:[^"\']+|twitter:[^"\']+|article:[^"\']+)["\'])[^>]*>/i',
        '',
        $html,
    ) ?? $html;
    $seoTags = preg_replace('/<(title|meta|link|script)\b/i', '<$1 data-rh="true"', $seoTags) ?? $seoTags;
    $html = str_replace('</head>', $seoTags . "\n</head>", $html);
    // Le résumé reste disponible sans JavaScript, sans clignoter avant React.
    return str_replace('<div id="root"></div>', '<div id="root"><noscript>' . $snapshot . '</noscript></div>', $html);
}

/** Extraire uniquement les métadonnées : jamais remplacer les CSS/JS du build. */
function mergeSeoPreview(string $html, string $preview): string
{
    preg_match('/<head\b[^>]*>(.*?)<\/head>/is', $preview, $head);
    preg_match_all(
        '/<title\b[^>]*>.*?<\/title>|<meta\b(?=[^>]*(?:name|property)=["\'](?:description|robots|og:[^"\']+|twitter:[^"\']+|article:[^"\']+)["\'])[^>]*>|<link\b(?=[^>]*rel=["\']canonical["\'])[^>]*>|<script\b(?=[^>]*type=["\']application\/ld\+json["\'])[^>]*>.*?<\/script>/is',
        $head[1] ?? '',
        $tags,
    );
    preg_match('/<body\b[^>]*>(.*?)<\/body>/is', $preview, $body);
    return mergeSeoHtml($html, implode("\n", $tags[0]), $body[1] ?? '');
}

/** @return array{endpoint: ?string, response: string|false, code: int, contentType: string} */
function fetchSeoPage(?string $endpoint, string $apiBaseUrl, string $apiKey): array
{
    if ($endpoint === null) {
        return ['endpoint' => null, 'response' => false, 'code' => 0, 'contentType' => ''];
    }

    // Les robots sociaux mettent longtemps en cache la première réponse reçue.
    // Un petit cache local évite qu'un démarrage à froid de l'API fasse tomber la
    // prévisualisation sur les balises génériques (et donc sur le logo du site).
    $cacheDirectory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'septentrional-seo-preview';
    $cacheFile = $cacheDirectory . DIRECTORY_SEPARATOR . hash('sha256', $endpoint) . '.html';
    $cacheTtl = 300;
    $staleCacheTtl = 86400;

    if (is_file($cacheFile) && filemtime($cacheFile) >= time() - $cacheTtl) {
        $cachedResponse = file_get_contents($cacheFile);
        if ($cachedResponse !== false) {
            return [
                'endpoint' => $endpoint,
                'response' => $cachedResponse,
                'code' => 200,
                'contentType' => 'text/html; charset=UTF-8',
            ];
        }
    }

    $ch = curl_init($apiBaseUrl . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'SeptentrionalSeoProxy/1.0',
        CURLOPT_HTTPHEADER => array_filter([
            'Accept: text/html',
            $apiKey !== '' ? 'X-API-Key: ' . $apiKey : null,
        ]),
    ]);
    $response = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($code === 200 && $response !== false && str_contains($contentType, 'text/html')) {
        if ((is_dir($cacheDirectory) || @mkdir($cacheDirectory, 0700, true)) && is_writable($cacheDirectory)) {
            $temporaryCacheFile = $cacheFile . '.' . getmypid() . '.tmp';
            if (file_put_contents($temporaryCacheFile, $response, LOCK_EX) !== false) {
                @rename($temporaryCacheFile, $cacheFile);
            }
        }

        return ['endpoint' => $endpoint, 'response' => $response, 'code' => $code, 'contentType' => $contentType];
    }

    // Si l'API connaît une panne courte, une ancienne carte correcte vaut mieux
    // que le logo générique. Le cache périmé reste utilisable pendant 24 heures.
    if (is_file($cacheFile) && filemtime($cacheFile) >= time() - $staleCacheTtl) {
        $cachedResponse = file_get_contents($cacheFile);
        if ($cachedResponse !== false) {
            return [
                'endpoint' => $endpoint,
                'response' => $cachedResponse,
                'code' => 200,
                'contentType' => 'text/html; charset=UTF-8',
            ];
        }
    }

    return ['endpoint' => $endpoint, 'response' => $response, 'code' => $code, 'contentType' => $contentType];
}

$mainSeoPages = mainSeoPages();
if (isset($mainSeoPages[$path])) {
    renderSeoShell($indexFile, $siteUrl, $path, $mainSeoPages[$path]);
}

// Mapping URL frontend → endpoint SEO backend pour les contenus dynamiques.
$seoEndpoint = null;
if (preg_match('#^/article/([^/?]+)$#', $path, $m)) {
    $seoEndpoint = '/articles/' . $m[1];
} elseif (preg_match('#^/video/([^/?]+)$#', $path, $m)) {
    $seoEndpoint = '/videos/' . $m[1];
} elseif (preg_match('#^/categorie/([^/?]+)$#', $path, $m)) {
    $seoEndpoint = '/categories/' . $m[1];
} elseif (preg_match('#^/pages/([^/?]+)$#', $path, $m)) {
    $seoEndpoint = '/pages/' . $m[1];
} elseif (preg_match('#^/(a-propos|contact|mentions-legales)$#', $path, $m)) {
    $seoEndpoint = '/pages/' . $m[1];
}

$spaOnlyRoute = preg_match('#^/(management(?:/.*)?|desabonnement/[^/]+)$#', $path);
if ($seoEndpoint === null && ! $spaOnlyRoute) {
    renderSeoShell($indexFile, $siteUrl, $path, [
        'title' => 'Page introuvable | Septentrional',
        'description' => 'La page demandée est introuvable.',
        'h1' => 'Page introuvable',
    ], 404);
}

$seoPage = fetchSeoPage($seoEndpoint, $apiBaseUrl, $apiKey);
if ($seoPage['code'] === 404) {
    renderSeoShell($indexFile, $siteUrl, $path, [
        'title' => 'Page introuvable | Septentrional',
        'description' => 'La page demandée est introuvable.',
        'h1' => 'Page introuvable',
    ], 404);
}

if ($seoPage['code'] === 200 && $seoPage['response'] && strpos($seoPage['contentType'], 'text/html') !== false) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=300, stale-while-revalidate=600');
    echo mergeSeoPreview(file_get_contents($indexFile), $seoPage['response']);
    exit;
}

if ($isBot && $seoEndpoint !== null) {
    // Ne jamais faire mémoriser le logo générique pour un contenu dynamique.
    // Un statut temporaire invite le robot social à recommencer plus tard.
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-store');
    header('Retry-After: 30');
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
        . '<meta name="robots" content="noindex"><title>Aperçu temporairement indisponible</title>'
        . '</head><body></body></html>';
    exit;
}

// ── Comportement normal : servir l'app React pour les vrais visiteurs ──
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
readfile($indexFile);
