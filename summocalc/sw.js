var CACHE_NAME = "sc-200508-3";
var urlsToCache = [
  ".",
  "index.html",
  "js/summocalc.js",
  "js/fraction.js",
  "js/listitem.js",
  "js/effect.js",
  "js/card.js",
  "js/ar.js",
  "js/codec.js",
  "js/calc.js",
  "css/style.css"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keyList){
    return Promise.all(keyList.map(function(name){
      if(CACHE_NAME.indexOf(name) === -1) return caches.delete(name);
    }));
  }));
});

self.addEventListener("fetch", function(e){
  e.respondWith(caches.match(e.request).then(function(response){
    return response || fetch(e.request);
  }));
});

/*
self.addEventListener("fetch", function(e){
  e.respondWith(fetch(e.request).catch(function(){
    return caches.match(e.request);
  }));
});
*/

self.addEventListener("message", function(e){
  switch(e.data){
    case "skipWaiting":
      skipWaiting();
  }
});
