const API_KEY = "992fdf94248413d82c5843e9c6b2df29"; 
const MQTT_BROKER = "broker.hivemq.com";
const MQTT_PORT = 8000;
const MQTT_TOPIC = "senai/weather/dashboard";

let chartInstance = null;
let historyData = [];
let mqttClient = null;

document.addEventListener("DOMContentLoaded", () => {
  initChart();
  initMQTT();
  carregarTema();
  carregarFavorito();

  document.getElementById("themeToggle").addEventListener("click", alternarTema);
});

function alternarTema() {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  document.getElementById("themeToggle").textContent = isDark ? "Modo Claro ☀️" : "Modo Escuro 🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function carregarTema() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    document.getElementById("themeToggle").textContent = "Modo Claro ☀️";
  }
}

function salvarFavorito() {
  const city = document.getElementById("cardCity").textContent;
  if (city && city !== "--") {
    localStorage.setItem("favCity", city);
    document.getElementById("favCityName").textContent = `Favorita: ${city}`;
  }
}

function carregarFavorito() {
  const fav = localStorage.getItem("favCity");
  if (fav) {
    document.getElementById("favCityName").textContent = `Favorita: ${fav}`;
  }
}

async function buscarClima() {
  const city = document.getElementById("cityInput").value.trim();
  const country = document.getElementById("countryInput").value.trim();
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("errorMessage");

  errorEl.classList.add("hidden");

  if (!city) {
    exibirErro("Informe uma cidade antes de realizar a consulta.");
    return;
  }

  const query = country ? `${city},${country}` : city;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&lang=pt_br&appid=${API_KEY}`;

  loadingEl.classList.remove("hidden");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) throw new Error("Cidade não encontrada. Verifique o nome informado.");
      if (response.status === 401) throw new Error("Não foi possível acessar o serviço. Verifique a API Key.");
      throw new Error("Não foi possível consultar os dados. Verifique sua conexão.");
    }

    const data = await response.json();
    atualizarInterface(data);
    atualizarGrafico(data.name, data.main.temp, data.main.humidity);
    atualizarHistorico(data.name, data.main.temp, data.main.humidity);
    publicarDadosMQTT(data);
    gerarAlertaClimatico(data.main.temp, data.weather[0].main);

  } catch (error) {
    exibirErro(error.message);
  } finally {
    loadingEl.classList.add("hidden");
  }
}

function exibirErro(msg) {
  const errorEl = document.getElementById("errorMessage");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function atualizarInterface(data) {
  document.getElementById("cardCity").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("cardTemp").textContent = `${Math.round(data.main.temp)} °C`;
  document.getElementById("cardFeelsLike").textContent = `${Math.round(data.main.feels_like)} °C`;
  document.getElementById("cardHumidity").textContent = `${data.main.humidity} %`;
  document.getElementById("cardWind").textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
  document.getElementById("cardPressure").textContent = `${data.main.pressure} hPa`;

  const agora = new Date();
  document.getElementById("lastUpdate").textContent = `Última atualização: ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
}

function gerarAlertaClimatico(temp, weatherCondition) {
  const alertCard = document.getElementById("weatherAlert");
  const alertText = document.getElementById("alertText");

  alertCard.classList.remove("hidden");

  if (temp > 32) {
    alertText.textContent = "🔥 Alerta de Calor Extremo! Mantenha-se hidratado e evite exposição solar.";
  } else if (temp < 10) {
    alertText.textContent = "❄️ Alerta de Frio Intenso! Proteja-se com agasalhos adequados.";
  } else if (weatherCondition.toLowerCase().includes("rain")) {
    alertText.textContent = "🌧️ Alerta de Chuva! Lembre-se de levar guarda-chuva e ter cuidado ao dirigir.";
  } else {
    alertText.textContent = "✅ Condições meteorológicas dentro da normalidade.";
  }
}

function atualizarHistorico(cidade, temp, umidade) {
  historyData.unshift({ cidade, temp, umidade });
  if (historyData.length > 5) historyData.pop();

  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  historyData.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.cidade} — Temp: ${Math.round(item.temp)}°C | Umidade: ${item.umidade}%`;
    historyList.appendChild(li);
  });
}

function initChart() {
  const ctx = document.getElementById("weatherChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura (°C)",
          data: [],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        },
        {
          label: "Umidade (%)",
          data: [],
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function atualizarGrafico(cidade, temp, umidade) {
  chartInstance.data.labels.push(cidade);
  chartInstance.data.datasets[0].data.push(temp);
  chartInstance.data.datasets[1].data.push(umidade);

  if (chartInstance.data.labels.length > 5) {
    chartInstance.data.labels.shift();
    chartInstance.data.datasets[0].data.shift();
    chartInstance.data.datasets[1].data.shift();
  }

  chartInstance.update();
}

function initMQTT() {
  const clientID = "web_client_" + Math.random().toString(16).substr(2, 8);
  mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, clientID);

  mqttClient.onConnectionLost = (response) => {
    document.getElementById("mqttStatus").textContent = "Desconectado";
  };

  mqttClient.connect({
    onSuccess: () => {
      document.getElementById("mqttStatus").textContent = "Conectado";
    },
    onFailure: () => {
      document.getElementById("mqttStatus").textContent = "Falha na conexão";
    },
    useSSL: false
  });
}

function publicarDadosMQTT(data) {
  if (mqttClient && mqttClient.isConnected()) {
    const payload = JSON.stringify({
      cidade: data.name,
      temp: data.main.temp,
      umidade: data.main.humidity,
      timestamp: new Date().toISOString()
    });

    const message = new Paho.MQTT.Message(payload);
    message.destinationName = MQTT_TOPIC;
    mqttClient.send(message);

    document.getElementById("mqttTopic").textContent = MQTT_TOPIC;
    document.getElementById("mqttPayload").textContent = payload;
  }
}