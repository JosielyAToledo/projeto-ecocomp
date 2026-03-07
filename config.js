const API_BASE =
  localStorage.getItem("api_base_url") || "https://projeto-ecocomp.onrender.com";

const estados = {
  bomba: true,
  lampada: false,
  ventoinha: false,
};

const labels = {
  bomba: "Bomba",
  lampada: "Lâmpada",
  ventoinha: "Ventoinha",
};

function atualizarEstadoVisual(tipo) {
  const status = document.getElementById(`status-${tipo}`);
  if (!status) return;

  const ativo = estados[tipo];
  status.innerText = ativo ? "Ativado" : "Desligado";
  status.className = `status-pill ${tipo} ${ativo ? "on" : "off"}`;

  const botao = status.closest(".config-actuator-card")?.querySelector("button");
  if (botao) {
    botao.innerText = `${ativo ? "Desativar" : "Ativar"} ${labels[tipo]}`;
  }
}

function sincronizarCampos(numberId, rangeId) {
  const numero = document.getElementById(numberId);
  const barra = document.getElementById(rangeId);
  if (!numero || !barra) return;

  const clamp = (value) => {
    const min = Number(numero.min || barra.min || 0);
    const max = Number(numero.max || barra.max || 100);
    const n = Number(value);
    return Math.min(max, Math.max(min, Number.isNaN(n) ? min : n));
  };

  const atualizarDaBarra = () => {
    numero.value = String(clamp(barra.value));
  };

  const atualizarDoNumero = () => {
    const v = clamp(numero.value);
    numero.value = String(v);
    barra.value = String(v);
  };

  barra.addEventListener("input", atualizarDaBarra);
  numero.addEventListener("input", atualizarDoNumero);
  numero.addEventListener("blur", atualizarDoNumero);
}

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

  try {
    await enviarComando(tipo, estados[tipo]);
    atualizarEstadoVisual(tipo);
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

["bomba", "ventoinha", "lampada"].forEach(atualizarEstadoVisual);
sincronizarCampos("threshold-solo", "threshold-solo-range");
sincronizarCampos("threshold-temp-max", "threshold-temp-max-range");
sincronizarCampos("threshold-temp-min", "threshold-temp-min-range");
