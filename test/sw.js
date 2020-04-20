var CACHE_NAME = "test-cache-1";
var urlsToCache = [
  ".",
  "index.html",
  "style.css"
];

function message(txt){
  clients.matchAll().then(function(list){
    list.forEach(function(c){
      c.postMessage({"txt": txt});
    });
  });
}

self.addEventListener("install", function(e){
  message("install event " + CACHE_NAME);
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener("activate", function(e){
  message("activate event " + CACHE_NAME);
  e.waitUntil(caches.keys().then(function(keyList){
    return Promise.all(keyList.map(function(name){
      if(CACHE_NAME.indexOf(name) === -1) return caches.delete(name);
    }));
  }));
});

self.addEventListener("fetch", function(e){
  message("fetch event " + e.request);
  e.respondWith(caches.match(e.request).then(function(response){
    return response || fetch(e.request);
  }));
});
