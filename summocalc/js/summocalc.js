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
function setValue(id, value){
  if(value === v(id)) return;
  var o = _(id);
  var p = o.options;
  if(p){
    var index = 0;
    for(var i = 0; i < p.length; i++){
      if(parseInt(p[i].value) === value){
        index = i;
        break;
      }
    }
    o.selectedIndex = index;
  }else if(o.type === "checkbox"){
    o.checked = !!value;
  }else{
    o.value = value;
  }
  if(!o.disabled && o.onchange) o.onchange();
}
function setOptions(id, list, k, s, p){
  //id, リスト[, フィルタ関数[, ソート順[, マイナス時接頭辞]]]
  var elem = _(id);
  var value = v(id);
  while(elem.firstChild) elem.removeChild(elem.firstChild);
  
  if(!s) s = list.map(function(v, i){return i});
  s.forEach(function(v){
    var x = list[Math.abs(v)];
    if(!k || k(x)){
      var o = document.createElement("option");
      o.appendChild(
        document.createTextNode(v < 0 ? t(p) + x : x)
      );
      o.setAttribute("value", v);
      elem.appendChild(o);
    }
  });
  /*
  if(s) list = s.map(function(v){
    return list[v];
  });
  if(k) list = list.filter(k);
  list.forEach(function(v){
    var o = document.createElement("option");
    o.appendChild(
      document.createTextNode(v)
    );
    o.setAttribute("value", v.index);
    elem.appendChild(o);
  });
  */
  elem.selectedIndex = 0;
  setValue(id, value);
}
function setText(id, str){
  _(id).innerHTML = t(str);
}
function linkInput(obj, key, id, onchange){
  setValue(id, obj[key]);
  _(id).onchange = function(){
    obj[key] = v(id);
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
