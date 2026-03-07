const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

const estados = {
  bomba: false,
  lampada: false,
  ventoinha: false,
};

async function enviarComando(tipo, ativo) {
  const res = await fetch(`${API_BASE}/api/actuators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, ativo }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

async function toggleDispositivo(tipo) {
  estados[tipo] = !estados[tipo];
  const badge = document.getElementById(`status-${tipo}`);

  try {
    await enviarComando(tipo, estados[tipo]);
    badge.innerText = estados[tipo] ? "LIGADA" : "DESLIGADA";
    badge.className = estados[tipo] ? "badge on" : "badge off";
  } catch (erro) {
    estados[tipo] = !estados[tipo];
    alert(`Falha ao enviar comando para ${tipo}: ${erro.message}`);
  }
}

async function salvarConfig() {
  const solo = Number(document.getElementById("threshold-solo").value);
  const tMax = Number(document.getElementById("threshold-temp-max").value);
  const tMin = Number(document.getElementById("threshold-temp-min").value);

  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soloMin: solo, tempMax: tMax, tempMin: tMin }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    alert("Parametros atualizados com sucesso.");
  } catch (erro) {
    alert(`Falha ao salvar configuracao: ${erro.message}`);
  }
}

window.toggleDispositivo = toggleDispositivo;
window.salvarConfig = salvarConfig;
