var CACHE_NAME = "sc-260904-2";
var urlsToCache = [
  ".",
  "index.html",
  "js/summocalc.js",
  "js/fraction.js",
  "js/listitem.js",
  "js/variant.js",
  "js/affiliation.js",
  "js/split.js",
  "js/tag.js",
  "js/effect.js",
  "js/timing.js",
  "js/card.js",
  "js/ar.js",
  "js/codec.js",
  "js/effectparam.js",
  "js/effectfilter.js",
  "js/skilltable.js",
  "js/calc.js",
  "js/filter.js",
  "css/style.css",
  "/img/weapon_a.png",
  "/img/weapon_b.png",
  "/img/attribute.svg"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){
    return cache.addAll(urlsToCache.map(function(url){
      return new Request(url, {cache: "no-store"});
    }));
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keyList){
    return Promise.all(keyList.filter(function(name){
      return name !== CACHE_NAME;
    }).map(function(name){
      return caches.delete(name);
    }));
  }));
});

self.addEventListener("fetch", function(e){
  e.respondWith(caches.match(e.request, {cacheName: CACHE_NAME}).then(function(response){
    return response || fetch(e.request, {cache: "no-cache"});
  }));
});

self.addEventListener("message", function(e){
  switch(e.data){
    case "skipWaiting":
      skipWaiting();
      break;
  }
});
