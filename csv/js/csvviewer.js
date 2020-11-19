const csv2table = (text) => {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  let n = 0;
  let order = 1;
  for(const row of text.split("\n")){
    const tr = document.createElement("tr");
    if(thead.rows.length){
      tr.className = (tbody.rows.length & 1) ? "odd" : "";
      for(const v of row.split(",")){
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
        td.onclick = () => {
          const i = td.cellIndex;
          const a = Array.from(tbody.rows);
          const mode = td.className;
          let count = 0;
          for(const r of a){
            if(mode){
              r.cells[i].className = "";
            }else{
              r.cells[i].className = (r.cells[i].textContent === v) ? "highlight" : "hide";
            }
            if(Array.prototype.some.call(r.cells, (c) => c.className === "hide")){
              r.className = "hide";
            }else{
              r.className = (count & 1) ? "odd" : "";
              count++;
            }
          }
          table.caption.textContent = `${count}件`;
        };
      }
      tbody.appendChild(tr);
    }else{
      for(const v of row.split(",")){
        const th = document.createElement("th");
        th.textContent = v;
        tr.appendChild(th);
        th.onclick = () => {
          const i = th.cellIndex;
          const a = Array.from(tbody.rows);
          let count = 0;
          order = (i === n) ? -order : 1;
          a.sort((a, b) => a.cells[i].textContent.localeCompare(b.cells[i].textContent, undefined, {numeric: true}) * order);
          n = i;
          for(const r of a){
            tbody.removeChild(r);
            tbody.appendChild(r);
            if(r.className !== "hide"){
              r.className = (count & 1) ? "odd" : "";
              count++;
            }
          }
        };
      }
      thead.appendChild(tr);
    }
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  table.createCaption().textContent = `${tbody.rows.length}件`;
  return table;
};

const csvViewer = (url) => {
  const p = document.createElement("p");
  const link = document.createElement("a");
  link.href = url;
  link.textContent = "Download CSV";
  p.appendChild(link);
  p.appendChild(document.createElement("hr"));
  p.appendChild(document.createTextNode("ヘッダセルをクリックでソート"));
  p.appendChild(document.createElement("br"));
  p.appendChild(document.createTextNode("データセルをクリックでフィルタ"));
  document.body.appendChild(p);
  fetch(url).then((response) => {
    if(response.ok){
      return response.text();
    }else{
      throw new Error(response.status);
    }
  }).then((text) => {
    const table = csv2table(text);
    document.body.appendChild(table);
  }).catch((e) => {
    document.body.appendChild(document.createTextNode(e));
  });
};
