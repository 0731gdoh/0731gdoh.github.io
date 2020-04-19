var CACHE_NAME = "cache-20200419-1";
var urlsToCache = [
  "index.html"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(urlsToCache);
    });
  );
});
/*
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keyList){
      return Promise.all(
        keyList.map(function(name){
          if(CACHE_NAME.indexOf(name) === -1) return caches.delete(name);
        });
      );
    });
  );
});
*/
self.addEventListener("fetch", function(e){
  e.respondWith(
    caches.match(e.request).then(function(response){
      return response || fetch(e.request);
    });
  );
});
