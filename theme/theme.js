"use strict";

const initTheme = () => {
  const m = window.matchMedia("(prefers-color-scheme: dark)");
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
  document.addEventListener("DOMContentLoaded", createThemeSelector);
};

const createThemeSelector = () => {
  const container = document.getElementById("select_theme");
  if(container){
    const select = document.createElement("select");
    for(const x of ["自動", "ライト", "ダーク"]){
      const option = document.createElement("option");
      option.textContent = x;
      select.appendChild(option);
    }
    select.selectedIndex = parseInt(document.documentElement.dataset.theme) || 0;
    if(HTMLDialogElement){
      const btn = document.createElement("input");
      const dialog = document.createElement("dialog");
      const title = document.createElement("div");
      const body = document.createElement("div");
      btn.type = "button";
      btn.value = title.textContent = "テーマ切替";
      dialog.classList.add("theme_dialog");
      body.appendChild(select);
      dialog.appendChild(title);
      dialog.appendChild(body);
      container.appendChild(btn);
      document.body.appendChild(dialog);
      btn.addEventListener("click", showModalFunction(dialog));
    }else{
      container.appendChild(select);
    }
    select.addEventListener("change", updateTheme);
  }
};

const updateTheme = (e) => {
  const n = e.currentTarget.selectedIndex;
  document.documentElement.dataset.theme = n;
  localStorage.setItem("theme", n);
};

const showModalFunction = (dialog) => {
  dialog.addEventListener("click", (e) => {
    if(!e.target.closest("div")) dialog.close();
  });
  return (e) => {
    dialog.showModal();
  };
};

initTheme();
