const CACHE_NAME = "order-game-cache-v2";
const urlsToCache = [
  "/order-game/index.html",
  "/order-game/mobile.html",
  "/order-game/style.css",
  "/order-game/script.js",
  "/order-game/icons/icon-192.png",
  "/order-game/icons/icon-512.png"
];


// 安裝階段：快取所有靜態資源
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error("Service Worker 安裝失敗：", err))
  );
});

// 啟用階段：移除舊版快取
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// 攔截所有 GET 請求：先從快取取資源，沒有才走網路
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        return cached || fetch(event.request);
      })
      .catch(err => {
        console.error("Service Worker fetch 錯誤：", err);
        // 不做離線回退，讓外層 handle 網路錯誤
      })
  );
});
