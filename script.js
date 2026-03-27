let desafios = [];
let usados = JSON.parse(localStorage.getItem("usados")) || {};
let atual = Number(localStorage.getItem("atual"));
let radarAtivo = false;


// ================= LISTA DE OVOS =================
async function carregarLista() {
  let res = await fetch("desafios.json");
  desafios = await res.json();

  let lista = document.getElementById("lista");
  if (!lista) return;

  lista.innerHTML = "";

  desafios.forEach((d, i) => {
    let btn = document.createElement("button");

    if (usados[i]) {
      btn.innerText = d.titulo + " ✅";
      btn.disabled = true;
    } else {
      btn.innerText = d.titulo;
      btn.onclick = () => selecionar(i);
    }

    lista.appendChild(btn);
  });
}

// ================= SELECIONAR OVO =================
function selecionar(i) {
  localStorage.setItem("atual", i);
  window.location.href = "desafio.html";
}

// ================= CARREGAR DESAFIO =================
async function carregarDesafio() {
  let res = await fetch("desafios.json");
  desafios = await res.json();

  let d = desafios[atual];
  if (!d) return;

  document.getElementById("titulo").innerText = d.titulo;
  document.getElementById("p1").innerText = d.pergunta1;
  document.getElementById("p2").innerText = d.pergunta2;
}

// ================= VALIDAR RESPOSTA =================
function validar() {
  let d = desafios[atual];

  let r1 = document.getElementById("r1").value.trim().toLowerCase();
  let r2 = document.getElementById("r2").value.trim().toLowerCase();

  if (r1 == d.resposta1 && r2.includes(d.resposta2)) {
    usados[atual] = true;
    localStorage.setItem("usados", JSON.stringify(usados));

    window.location.href = "busca.html";
  } else {
    document.getElementById("feedback").innerText = "❌ Tente novamente";
  }
}

// ================= BLUETOOTH =================
async function buscar() {
  try {
    let d = desafios[atual];

    document.getElementById("status").innerText = "🔎 Procurando dispositivo...";

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: "BBC micro:bit" },
        { namePrefix: "micro:bit" }
      ],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
    });

    const server = await device.gatt.connect();

    const service = await server.getPrimaryService(
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
    );

    const RX = await service.getCharacteristic(
      '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
    );

    await RX.startNotifications();

    document.getElementById("status").innerText = "📡 Conectado! Aproximando do ovo...";

    RX.addEventListener('characteristicvaluechanged', (event) => {
      let value = new TextDecoder().decode(event.target.value).trim();

      console.log("Recebido:", value);

      if (value === d.device) {
        document.getElementById("status").innerText = "🟢 Ovo correto! Pode procurar!";

        if (!radarAtivo) {
          iniciarRadar();
          radarAtivo = true;
        }

      } else {
        document.getElementById("status").innerText = "❌ Esse não é o ovo certo!";
      }
    });

  } catch (erro) {
    console.log(erro);
    document.getElementById("status").innerText = "❌ Erro ao conectar. Tente novamente.";
  }
}

// ================= RADAR =================
function iniciarRadar() {
  setInterval(() => {
    let n = Math.random();

    if (n < 0.3) {
      document.getElementById("radar").innerText = "🔴 Frio";
    } else if (n < 0.7) {
      document.getElementById("radar").innerText = "🟡 Quente";
    } else {
      document.getElementById("radar").innerText = "🟢 MUITO PERTO!";
    }
  }, 1000);
}

// ================= RESET ADMIN =================
function resetar() {
  let senha = prompt("Senha:");
  if (senha === "33218600") {
    localStorage.clear();
    location.reload();
  } else {
    alert("Senha incorreta");
  }
}