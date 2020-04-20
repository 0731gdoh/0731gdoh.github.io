var CACHE_NAME = "test-cache-v5";
var urlsToCache = [
  ".",
  "index.html",
  "style.css"
];
var q = [];

function msg(txt){
  q.push("☆" + txt);
  clients.matchAll().then(function(list){
    list.forEach(function(c){
      c.postMessage({"txt": q.join("\n")});
    });
  });
}

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    msg("install event " + CACHE_NAME);
    return cache.addAll(urlsToCache);
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keyList){
    msg("activate event " + CACHE_NAME);
    return Promise.all(keyList.map(function(name){
      if(CACHE_NAME.indexOf(name) === -1) return caches.delete(name);
    }));
  }));
});

self.addEventListener("fetch", function(e){
  msg("fetch event " + e.request.url);
  e.respondWith(fetch(e.request).catch(function(){
    return caches.match(e.request);
  }));
});
