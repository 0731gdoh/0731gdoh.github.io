"use strict";

var language = 0;

function _(id){
  return document.getElementById(id);
}
function t(str, x){
  return str.indexOf("/") === -1 ? str : (str.split("/")[x === undefined ? language : x] || "").replace(/%%/g, "/");
}
function comma(n){
  return ("" + n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
function check(a, b, mode){
  if(!b) return false;
  switch(mode){
    case 0:
      return !(a & b);
    case 1:
      return (a & b) !== b;
    case 2:
      return !!(a & b);
    default:
      return false;
  }
}
function toLowerKatakana(str){
  return str.toLowerCase().replace(/\x2f/g, "%%").replace(/[\u3041-\u3094]/g, function(match){
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}
function toLowerHiragana(str){
  return str.toLowerCase().replace(/\x2f/g, "%%").replace(/[\u30a1-\u30f4]/g, function(match){
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}
function v(x, y){
  var o = _(x);
  var value = parseInt(o.value) || 0;
  if(o.type === "checkbox") return o.checked ? 1 : 0;
  if(o.tagName === "FIELDSET") return -1;
  if(o.disabled && y) return y;
  if(o.min) return o.value = Math.max(Math.min(value, o.max), o.min);
  return value;
}
function setValue(id, value, skipUpdate, zeroCount){
  if(value === v(id)) return;
  var o = _(id);
  var p = o.options;
  if(p){
    var parent = zeroCount ? o.querySelectorAll("optgroup")[zeroCount - 1] : o;
    var index = 0;
    for(var i = 0; i < p.length; i++){
      var x = parseInt(p[i].value);
      if(x === value && parent.contains(p[i])){
        index = i;
        break;
      }
    }
    o.selectedIndex = index;
  }else if(o.type === "checkbox"){
    o.checked = !!value;
  }else if(o.tagName === "FIELDSET"){
    var r = o.querySelectorAll(".cb > input");
    var all = o.querySelector("legend > input");
    for(var i = 0; i < r.length; i++){
      r[i].checked = !((value & r[i].value) - r[i].value);
    }
    all.checked = !(all.value - value);
  }else{
    o.value = value;
  }
  if(!skipUpdate){
    if(o.onchange) o.onchange();
    if(o.oninput) o.oninput();
  }
}
function setOptions(id, list, params){
  var elem = _(id);
  var value = v(id);
  var zeroCount = 0;
  var containers = [document.createDocumentFragment()];
  var ci = 0;
  var filter, order, ogl, d, text;
  if(params){
    filter = params.filter;
    order = params.order;
    ogl = params.labels;
    d = params.divisor;
    text = params.text;
  }
  if(!order) order = list.LOCALE_ORDER ? list.LOCALE_ORDER[language] : list.ORDER || list.map(function(v, i){return i});
  if(ogl){
    if(!elem.firstChild){
      ogl.forEach(function(label){
        if(label){
          var og = document.createElement("optgroup");
          og.label = t(label);
          containers.push(og);
        }else{
          containers.push(null);
        }
      });
    }else{
      var n = 0;
      var parent = elem.options[Math.max(elem.selectedIndex, 0)].parentNode;
      while(elem.firstChild){
        var og = elem.removeChild(elem.firstChild);
        if(og.tagName === "OPTGROUP"){
          while(!ogl[containers.length - 1]){
            containers.push(null);
          }
          og.label = t(ogl[containers.length - 1]);
          ++n;
          if(og === parent) zeroCount = n;
          containers.push(og);
          while(og.firstChild) og.removeChild(og.firstChild);
        }
      }
    }
  }else{
    while(elem.firstChild) elem.removeChild(elem.firstChild);
  }
  order.forEach(function(v, i){
    var x = list[d ? v % d : v];
    if(!filter || filter(x)){
      if(!i || v){
        var o = document.createElement("option");
        o.textContent = (!i && text) ? t(text) : d ? params.prefixes[Math.floor(v / d)] + x : x;
        o.value = v;
        containers[ci].appendChild(o);
      }
      if(!v && ogl) ++ci;
    }
  });
  containers.forEach(function(x){
    if(x) elem.appendChild(x);
  });
  elem.selectedIndex = 0;
  setValue(id, value, true, zeroCount);
  if(elem.onchange && v(id) !== value) elem.onchange();
}
function setText(id, str){
  var o = _(id);
  if(o.type === "button"){
    o.value = t(str);
  }else{
    o.textContent = t(str);
  }
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
function setCheckGroup(id, list, params){
  var fieldset = _(id);
  var value = 0;
  var filter, order, sel, chk;
  if(params){
    filter = params.filter;
    order = params.order;
    sel = params.select;
    chk = params.check;
  }
  if(!order) order = list.LOCALE_ORDER ? list.LOCALE_ORDER[language] : list.ORDER || list.map(function(v, i){return i});
  if(fieldset.hasChildNodes()){
    var r = _(id).querySelectorAll("div > label");
    var i = 0;
    order.forEach(function(v){
      var x = list[v];
      if(x.name && (!filter || filter(x))){
        var c = _(r[i].htmlFor);
        if(c.checked) value |= c.value;
        r[i].textContent = x;
        c.value = 1 << v;
        i++;
      }
    });
    if(chk && r[i]) r[i].textContent = t(chk);
    setValue(id, value);
  }else{
    var legend = document.createElement("legend");
    var container = document.createElement("div");
    container.className = "nm";
    fieldset.appendChild(legend);
    fieldset.appendChild(container);
    order.forEach(function(v, i){
      var x = list[v];
      if(x.name && (!filter || filter(x))){
        var div = document.createElement("div");
        div.className = "cb";
        value |= 1 << v;
        appendCheck(div, id + i, 1 << v, x);
        if(list.BR && list.BR.indexOf(v) !== -1) container.appendChild(document.createElement("br"));
        container.appendChild(div);
      }
    });
    appendCheck(legend, id + "_all", value, "ALL");
    if(sel || chk){
      var hr = document.createElement("hr");
      var div = document.createElement("div");
      div.className = "bs";
      fieldset.appendChild(hr);
      fieldset.appendChild(div);
      if(chk) appendCheck(div, id + "_c", 0, t(chk));
      if(sel){
        var select =  document.createElement("select");
        select.id = id + "_mode";
        div.appendChild(select);
        setOptions(select.id, sel);
      }
    }
  }
}
function appendCheck(container, id, value, text){
  var checkbox = document.createElement("input");
  var label = document.createElement("label");
  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.value = value;
  label.htmlFor = id;
  label.textContent = text;
  container.appendChild(checkbox);
  container.appendChild(label);
}
function hideCurrent(obj){
  if(obj.current){
    _(obj.current).style.display = "none";
    _(obj.current + "_btn").classList.remove("ac");
  }
}
function linkCheckGroup(obj, key, id, onchange){
  var btn = id + "_btn";
  setValue(id, obj[key]);
  if(_(btn)) _(btn).onclick = function(){
    hideCurrent(obj);
    if(obj.current === id){
      obj.current = "";
    }else{
      obj.current = id;
      _(id).style.display = "block";
      _(btn).classList.add("ac");
    }
  };
  _(id).onchange = function(evt){
    var a = _(id).querySelector("legend > input");
    var r = _(id).querySelectorAll(".cb > input");
    var s = _(id).querySelectorAll(".cb > label");
    var x = [];
    var n = 0;
    if(evt && evt.target === a){
      if(a.checked) n = a.value - 0;
      for(var i = 0; i < r.length; i++){
        r[i].checked = a.checked;
        if(a.checked) x.push(s[i].textContent);
      }
    }else{
      for(var i = 0; i < r.length; i++){
        if(r[i].checked){
          n |= r[i].value;
          x.push(s[i].textContent);
        }
      }
      a.checked = !(a.value - n);
    }
    obj[key] = n;
    if(_(btn)) _(btn).value = "[" + x.length + "] " + x.join("|");
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
function download(data, mime, name){
  var blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), data], {type: mime});
  if(navigator.msSaveOrOpenBlob){
    navigator.msSaveOrOpenBlob(blob, name);
  }else if(URL && URL.createObjectURL && "download" in HTMLAnchorElement.prototype){
    var a = document.createElement("a");
    var url = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.href = url;
    a.download = name;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }else{
    window.open("data:" + mime + ";charset=UTF-8,%EF%BB%BF" + encodeURIComponent(data));
  }
}
function register(url){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register(url).then(function(reg){
      var updatefound = function(){
        reg.installing.onstatechange = function(){
          if(this.state === "installed" && navigator.serviceWorker.controller) showUpdateMessage(reg);
        };
      };
      if(reg.waiting) return showUpdateMessage(reg);
      if(reg.installing) updatefound();
      reg.onupdatefound = updatefound;
    });
  }
}
function showUpdateMessage(reg){
  var reload = false;
  navigator.serviceWorker.oncontrollerchange = function(){
    if(reload) return;
    reload = true;
    location.reload();
  }
  _("ub").onclick = function(){
    if(reg.waiting){
      reg.waiting.postMessage("skipWaiting");
    }else{
      location.reload();
    }
  };
  _("un").style.display = "block";
}
function checkUpdate(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.getRegistration().then(function(reg){
      if(reg) reg.update();
    });
  }
}
function initTheme(){
  var m = window.matchMedia("(prefers-color-scheme: dark)");
  document.documentElement.dataset.theme = localStorage.getItem("theme") || 0;
  if(m.matches){
    document.documentElement.classList.add("dark");
  }
  m.addEventListener("change", function(){
    if(m.matches){
      document.documentElement.classList.add("dark");
    }else{
      document.documentElement.classList.remove("dark");
    }
  });
}
initTheme();

onload = function(){
  register("sw.js");
  calc.init();
};
onhashchange = function(){
  location.reload();
};
