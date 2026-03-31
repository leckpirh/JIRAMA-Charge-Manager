// ========================================
// SERVICE WORKER - JIRAMA CHARGE MANAGER
// Permet à l'application de fonctionner hors ligne
// ========================================

// Nom du cache (changez le numéro pour forcer une mise à jour)
const CACHE_NAME = 'jirama-v1';

// Liste des fichiers à mettre en cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// ========================================
// ÉTAPE 1 : INSTALLATION
// Le navigateur télécharge et met en cache les fichiers
// ========================================
self.addEventListener('install', event => {
    console.log('🔧 [SW] Installation...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 [SW] Mise en cache des fichiers');
                return cache.addAll(FILES_TO_CACHE);
            })
            .catch(error => {
                console.error('❌ [SW] Erreur de cache:', error);
            })
    );
    
    // Force le nouveau service worker à prendre le contrôle immédiatement
    self.skipWaiting();
});

// ========================================
// ÉTAPE 2 : ACTIVATION
// Nettoyage des anciens caches
// ========================================
self.addEventListener('activate', event => {
    console.log('🚀 [SW] Activation...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ [SW] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Prend le contrôle de toutes les pages
    self.clients.claim();
});

// ========================================
// ÉTAPE 3 : INTERCEPTION DES REQUÊTES
// Décide si on prend le fichier du cache ou du réseau
// ========================================
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Ne pas intercepter les requêtes vers d'autres domaines (CDN)
    if (url.origin !== location.origin) {
        // Pour les CDN (comme les polices), on essaie le cache puis le réseau
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
        return;
    }
    
    // Pour nos fichiers locaux
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si le fichier est dans le cache, on le renvoie
                if (response) {
                    console.log('📀 [SW] Cache hit:', url.pathname);
                    return response;
                }
                
                // Sinon, on va chercher sur le réseau
                console.log('🌐 [SW] Network:', url.pathname);
                return fetch(event.request).then(networkResponse => {
                    // On met en cache pour la prochaine fois
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                });
            })
            .catch(() => {
                // En cas d'échec (hors ligne), on peut retourner une page d'erreur
                console.log('⚠️ [SW] Hors ligne, pas de cache pour:', url.pathname);
                // Retourner une réponse personnalisée pour les pages manquantes
                return new Response('Page non disponible hors ligne', { status: 404 });
            })
    );
});

// ========================================
// ÉTAPE 4 : NOTIFICATION DES MISES À JOUR
// ========================================
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
