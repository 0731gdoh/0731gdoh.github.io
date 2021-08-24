const parseCsv = (text) => {
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

const csv2table = (data, s, compareTable) => {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  let header = true;
  let n = 0;
  for(const row of data){
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
  table.createCaption().textContent = `${tbody.rows.length}件`;
  thead.addEventListener("click", _sorter(table, compareTable));
  tbody.addEventListener("click", _filter(table));
  return table;
};

const _sorter = (table, compareTable) => {
  let n = -1;
  let order = 1;
  compareTable = compareTable || [];
  return (evt) => {
    const th = evt.target.closest("th");
    if(th){
      const tbody = table.tBodies[0];
      const i = th.cellIndex;
      const rows = Array.from(tbody.rows);
      const compare = compareTable[i] || new Intl.Collator(undefined, {numeric: true}).compare;
      let count = 0;
      order = (i === n) ? -order : 1;
      rows.sort((a, b) => compare(a.cells[i].textContent, b.cells[i].textContent) * order);
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

const csvViewer = (parent, url, s, data, compareTable) => {
  const p = document.createElement("p");
  const link = document.createElement("a");
  const hr = document.createElement("hr");
  link.textContent = "Download CSV";
  p.appendChild(link);
  p.appendChild(hr);
  p.appendChild(document.createTextNode("ヘッダセルをクリックでソート"));
  p.appendChild(document.createElement("br"));
  p.appendChild(document.createTextNode("データセルをクリックでフィルタ"));
  parent.appendChild(p);
  if(data){
    const table = csv2table(data, s, compareTable);
    parent.appendChild(table);
    link.href = createURL(data);
    link.download = url;
  }else{
    fetchCsv(url).then((text) => {
      const table = csv2table(parseCsv(text), s, compareTable);
      parent.appendChild(table);
    }).catch((e) => {
      parent.appendChild(document.createTextNode(e));
    });
    link.href = url;
  }
};

const fetchCsv = (url) => {
  return fetch(url).then((response) => {
    if(response.ok){
      return response.text();
    }else{
      throw new Error(`${response.status} ${response.statusText}`);
    }
  });
};

const createURL = (data) => {
  const text = data.map((row) => {
    return row.map((cell) => {
      cell = cell.replace(/"/g, '""');
      if(/[",\n]/.test(cell)) return `"${cell}"`;
      return cell;
    }).join(",");
  }).join("\r\n");
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), text], {type: "text/csv"});
  return URL.createObjectURL(blob);
};
