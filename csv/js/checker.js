"use strict";

const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
let documentTitle = "";

const save = () => {
  const result = [];
  let i = 0;
  let v = 0;
  let count = 0;
  for(const row of source){
    if(row[CHECKER_INDEX].checkbox.checked){
      v = v | (1 << (5 - i));
      count++;
    }
    if(++i === 6){
      result.push(b64[v]);
      v = 0;
      i = 0;
    }
  }
  if(i) result.push(b64[v]);
  history.replaceState(null, "", location.pathname + "#" + result.join(""));
  updateTitle(count, source.length);
};

const load = () => {
  const hash = location.hash.slice(1);
  if(hash) _load(hash);
};

const _load = (hash) => {
  const list = Array.from(hash);
  const result = [];
  let i = 0;
  let v = 0;
  let count = 0;
  for(const row of source){
    if(--i < 0){
      i = 5;
      v = b64.indexOf(list.shift());
      if(v === -1) v = 0;
    }
    if(v & (1 << i)){
      row[CHECKER_INDEX].checkbox.checked = true;
      count++;
    }
  }
  data[1][checkerIndex].notify();
  updateTitle(count, source.length);
};

const updateTitle = (count, length) => {
  if(!documentTitle) documentTitle = document.title;
  document.title = `${documentTitle}（${count}/${length}）`;
};

const initChecker = (shareId) => {
  const share = document.getElementById(shareId);
  if(navigator.share){
    share.addEventListener("click", () => {
      navigator.share({
        title: document.title,
        url: location.href,
        text: document.title
      });
    });
  }else{
    share.remove();
  }
  document.body.addEventListener("change", save);
  window.addEventListener("hashchange", load);
  load();
};