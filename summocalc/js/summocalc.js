var language = -1;

function _(id){
  return document.getElementById(id);
}
function t(str, x){
  return str.indexOf("/") < 0 ? str : str.split("/")[x === undefined ? language : x];
}
function v(x, y){
  var o = _(x);
  var value = parseInt(o.value) || 0;
  if(o.type === "checkbox") return o.checked ? 1 : 0;
  if(o.disabled && y) return y;
  if(o.min) return o.value = Math.max(Math.min(value, o.max), o.min);
  return value;
}
function setValue(id, value, zeroCount){
  if(value === v(id)) return;
  var o = _(id);
  var p = o.options;
  if(p){
    var index = 0;
    var checkZero = (zeroCount !== undefined);
    zeroCount = zeroCount || 0;
    for(var i = 0; i < p.length; i++){
      var x = parseInt(p[i].value);
      if(x === value && zeroCount === 0){
        index = i;
        break;
      }
      if(x === 0 && checkZero) zeroCount--;
    }
    o.selectedIndex = index;
  }else if(o.type === "checkbox"){
    o.checked = !!value;
  }else if(o.tagName === "FIELDSET"){
    var r = o.querySelectorAll("div > input");
    var m = (1 << r.length) - 1;
    for(var i = 0; i < r.length; i++){
      r[i].checked = !!(value & (1 << i));
    }
    o.querySelector("legend > input").checked = (m === (value & m));
  }else{
    o.value = value;
  }
  if(!o.disabled){
    if(o.onchange) o.onchange();
    if(o.oninput) o.oninput();
  }
}
function setOptions(id, list, k, s, d, p){
  //id, リスト[, フィルタ関数[, ソート順[, 除数, 接頭辞リスト]]]
  var elem = _(id);
  var fragment = document.createDocumentFragment();
  var value = v(id);
  var zeroCount = 0;
  var n = elem.selectedIndex;
  while(elem.firstChild){
    var fc = elem.firstChild;
    if(n){
      n--;
      if(parseInt(fc.value) === 0) zeroCount++;
    }
    elem.removeChild(fc);
  }
  if(!s) s = list.map(function(v, i){return i});
  s.forEach(function(v){
    var x = list[d ? v % d : v];
    if(!k || k(x)){
      var o = document.createElement("option");
      o.textContent = d ? p[Math.floor(v / d)] + x : x;
      o.value = v;
      fragment.appendChild(o);
    }
  });
  elem.appendChild(fragment);
  elem.selectedIndex = 0;
  setValue(id, value, zeroCount);
}
function setText(id, str){
  _(id).textContent = t(str);
}
function selectRandomly(id){
  var o = _(id);
  var n = o.length - 1;
  if(n){
    o.selectedIndex = Math.floor(Math.random() * n) + 1;
    if(o.onchange) o.onchange();
  }
}
function linkInput(obj, key, id, onchange){
  setValue(id, obj[key]);
  _(id).onchange = function(){
    obj[key] = v(id);
    if(onchange) onchange();
    if(obj.active) obj.update();
  };
}
function linkTextInput(obj, key, id, oninput){
  setValue(id, obj[key]);
  _(id).oninput = function(){
    obj[key] = _(id).value;
    if(oninput) oninput();
    if(obj.active) obj.update();
  };
}
function setCheckGroup(id, list, br){
  var fieldset = _(id);
  if(fieldset.hasChildNodes()){
    var r = _(id).querySelectorAll("div > label");
    list.forEach(function(v, i){
      r[i].textContent = t(v);
    });
  }else{
    var legend = document.createElement("legend");
    list = ["ALL"].concat(list);
    list.forEach(function(v, i){
      var container = document.createElement(i ? "div" : "legend");
      var check = document.createElement("input");
      var label = document.createElement("label");
      if(i) container.className = "cb";
      check.type = "checkbox";
      check.id = id + i;
      check.checked = true;
      label.htmlFor = check.id;
      label.textContent = t(v);
      container.appendChild(check);
      container.appendChild(label);
      if(i === br){
        fieldset.appendChild(document.createElement("br"));
      }
      fieldset.appendChild(container);
    });
  }
}
function linkCheckGroup(obj, key, id, onchange){
  setValue(id, obj[key]);
  _(id).onchange = function(evt){
    var a = _(id).querySelector("legend > input");
    var r = _(id).querySelectorAll("div > input");
    var n = 0;
    if(evt && evt.target === a){
      n = a.checked ? (1 << r.length) - 1 : 0
      for(var i = 0; i < r.length; i++){
        r[i].checked = !!n;
      }
    }else{
      for(var i = 0; i < r.length; i++){
        if(r[i].checked) n += 1 << i;
      }
      a.checked = (n + 1 === 1 << r.length);
    }
    obj[key] = n;
    if(onchange) onchange();
    if(obj.active) obj.update();
  };
}
function copyText(id){
  var r = 1;
  try{
    var range = document.createRange();
    range.selectNode(_(id));
    window.getSelection().addRange(range);
    if(document.execCommand("copy")) r = 0;
  }catch(e){
    r = 1;
  }
  alert(t(["コピーしました/Copied to clipboard.", "コピーできませんでした/Copying failed."][r]));
}
function share(data){
  try{
    navigator.share(data);
  }catch(e){}
}
function pad(n, length){
  return ("00" + n).slice(-length);
}
function setBlobURL(id, data, mime, name){
  var a = _(id);
  var blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), data], {type: mime});
  if(navigator.msSaveOrOpenBlob){
    a.href = "javascript:void(0)";
    a.onclick = function(){
      navigator.msSaveOrOpenBlob(blob, name);
    };
  }else if(URL && URL.createObjectURL && "download" in HTMLAnchorElement.prototype){
    a.href = URL.createObjectURL(blob);
    a.download = name;
  }else{
    a.href = "data:" + mime + ";charset=UTF-8,%EF%BB%BF" + encodeURIComponent(data);
    a.target = "_blank";
  }
}
function isStandalone(){
  if(matchMedia("(display-mode: standalone)").matches || navigator.standalone) return true;
  return false;
}
function register(url){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register(url).then(function(reg){
      if(reg.waiting) showUpdateMessage(reg);
      reg.onupdatefound = function(){
        reg.installing.onstatechange = function(){
          if(this.state === "installed" && navigator.serviceWorker.controller) showUpdateMessage(reg);
        };
      };
    });
  }
}
function showUpdateMessage(reg){
  var o = _("un");
  _("ub").onclick = function(){
    o.style.display = "none";
    if(!reg.waiting) return;
    reg.waiting.postMessage("skipWaiting");
    location.reload();
  };
  o.style.display = "block";
}
function checkUpdate(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.getRegistration().then(function(reg){
      if(reg) reg.update();
    });
  }
}

onload = function(){
  register("sw.js");
  calc.init();
};
onhashchange = function(){
  location.reload();
};
