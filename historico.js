const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

let historyChart;

function formatarData(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleString("pt-BR");
}

function normalizar(item) {
  return {
    createdAt: item.createdAt || item.timestamp || new Date().toISOString(),
    soil: Number(item.soil ?? item.soloEstufa ?? 0),
    soilExternal: Number(item.soilExternal ?? item.soloExterno ?? 0),
    temp: Number(item.temp ?? item.tempEstufa ?? 0),
    tempExternal: Number(item.tempExternal ?? item.tempExterno ?? 0),
  };
}

async function carregarDadosHistoricos() {
  const periodo = Number(document.getElementById("periodo").value);
  const limit = Math.max(periodo * 24, 30);

  try {
    const res = await fetch(`${API_BASE}/api/data?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lista = (await res.json()).map(normalizar).reverse();
    atualizarTabela(lista);
    atualizarGrafico(lista);
  } catch (erro) {
    console.error("Falha ao carregar historico:", erro.message);
  }
}

function atualizarTabela(lista) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  for (const item of lista) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatarData(item.createdAt)}</td>
      <td>${item.soil.toFixed(0)}%</td>
      <td>${item.soilExternal.toFixed(0)}%</td>
      <td>${item.temp.toFixed(1)}°C</td>
      <td>${item.tempExternal.toFixed(1)}°C</td>
    `;
    tbody.appendChild(row);
  }
}

function atualizarGrafico(lista) {
  const labels = lista.map((x) => formatarData(x.createdAt));
  const dadosSolo = lista.map((x) => x.soil);
  const dadosTemp = lista.map((x) => x.temp);

  const ctx = document.getElementById("historyChart").getContext("2d");

  if (historyChart) {
    historyChart.destroy();
  }

  historyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Solo estufa (%)",
          data: dadosSolo,
          borderColor: "#2d6a4f",
          yAxisID: "y",
        },
        {
          label: "Temp estufa (°C)",
          data: dadosTemp,
          borderColor: "#e76f51",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { position: "left", beginAtZero: true, max: 100 },
        y1: { position: "right", beginAtZero: true },
      },
    },
  });
}

function exportarCSV() {
  const rows = [["DataHora", "SoloEstufa", "SoloExterno", "TempEstufa", "TempExterno"]];
  const trList = document.querySelectorAll("#table-body tr");

  trList.forEach((tr) => {
    const cols = [...tr.querySelectorAll("td")].map((td) => td.innerText);
    rows.push(cols);
  });

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "historico_estufa.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.carregarDadosHistoricos = carregarDadosHistoricos;
window.exportarCSV = exportarCSV;

carregarDadosHistoricos();
