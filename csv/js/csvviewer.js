const csv = (text) => {
  const ex = /,|\r?\n|"(?:[^"]|"")*"|[^,"\r\n][^,\r\n]*/g
  const data = [];
  let row = [""];
  let m;
  text = text.replace(/(?:\r?\n)+$/, "");
  while((m = ex.exec(text)) !== null){
    let v = m[0];
    switch(v[0]){
      case ",":
        row.push("");
        break;
      case "\r":
      case "\n":
        data.push(row);
        row = [""];
        break;
      case '"':
        v = v.slice(1, -1).replace(/""/g, '"');
      default:
        row.pop();
        row.push(v);
    }
  }
  data.push(row);
  return data;
}

const csv2table = (text, s) => {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  let header = true;
  let n = 0;
  for(const row of csv(text)){
    const tr = document.createElement("tr");
    if(header){
      for(const v of row){
        const th = document.createElement("th");
        th.textContent = v;
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      header = false;
    }else{
      tr.className = (n++ & 1) ? "odd" : "";
      for(const v of row){
        const td = document.createElement("td");
        const kwds = s ? v.split(s) : [v];
        let i = 0;
        for(const p of kwds){
          const span = document.createElement("span");
          span.textContent = p;
          if(i++) td.appendChild(document.createTextNode(s));
          td.appendChild(span);
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  table.createCaption.textContent = `${tbody.rows.length}件`;
  thead.addEventListener("click", _sorter(table));
  tbody.addEventListener("click", _filter(table));
  return table;
};

const _sorter = (table) => {
  let n = -1;
  let order = 1;
  return (evt) => {
    const th = evt.target.closest("th");
    if(th){
      const tbody = table.tBodies[0];
      const i = th.cellIndex;
      const rows = Array.from(tbody.rows);
      let count = 0;
      order = (i === n) ? -order : 1;
      rows.sort((a, b) => a.cells[i].textContent.localeCompare(b.cells[i].textContent, undefined, {numeric: true}) * order);
      n = i;
      for(const tr of rows){
        tbody.removeChild(tr);
        tbody.appendChild(tr);
        if(tr.className !== "hide"){
          tr.className = (count++ & 1) ? "odd" : "";
        }
      }
    }
  };
};

const _filter = (table) => {
  return (evt) => {
    const td = evt.target.closest("td");
    if(td){
      const i = td.cellIndex;
      const rows = Array.from(table.tBodies[0].rows);
      const kwds = Array.prototype.map.call(td.children, (c) => c.textContent);
      const mode = td.className;
      let count = 0;
      for(const tr of rows){
        if(mode){
          tr.cells[i].className = "";
        }else{
          let cls = "hide";
          for(const d of Array.from(tr.cells[i].children)){
            if(kwds.indexOf(d.textContent) !== -1){
              cls = "highlight";
              d.className = cls;
            }else{
              d.className = "";
            }
          }
          tr.cells[i].className = cls;
        }
        if(Array.prototype.some.call(tr.cells, (c) => c.className === "hide")){
          tr.className = "hide";
        }else{
          tr.className = (count++ & 1) ? "odd" : "";
        }
      }
      table.caption.textContent = `${count}件`;
    }
  };
};

const csvViewer = (parent, url, s) => {
  const p = document.createElement("p");
  const link = document.createElement("a");
  const hr = document.createElement("hr");
  link.href = url;
  link.textContent = "Download CSV";
  p.appendChild(link);
  p.appendChild(hr);
  p.appendChild(document.createTextNode("ヘッダセルをクリックでソート"));
  p.appendChild(document.createElement("br"));
  p.appendChild(document.createTextNode("データセルをクリックでフィルタ"));
  parent.appendChild(p);
  fetch(url).then((response) => {
    if(response.ok){
      const lm = response.headers.get("Last-Modified");
      if(lm){
        const date = new Date(lm).toLocaleDateString();
        const span = document.createElement("span");
        span.textContent = `最終更新：${date}`;
        span.className = "time";
        p.insertBefore(span, hr);
      }
      return response.text();
    }else{
      throw new Error(`${response.status} ${response.statusText}`);
    }
  }).then((text) => {
    const table = csv2table(text, s);
    parent.appendChild(table);
  }).catch((e) => {
    parent.appendChild(document.createTextNode(e));
  });
};
