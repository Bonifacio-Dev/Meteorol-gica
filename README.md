# Dashboard Meteorológico Profissional SENAI

## Objetivo do Projeto
Aplicação web responsiva desenvolvida para consulta meteorológica em tempo real integrando a API OpenWeatherMap, publicação de métricas em um corretor (broker) MQTT e exibição gráfica dinâmica das consultas realizadas.

## Tecnologias Utilizadas
- **HTML5 & CSS3**: Estruturação semântica e estilização com variáveis CSS e Grid/Flexbox responsivo.
- **JavaScript (ES6+)**: Lógica da aplicação, requisições assíncronas (Fetch API) e manipulação do DOM.
- **OpenWeatherMap API**: Fornecimento dos dados de clima atuais.
- **Chart.js**: Renderização de gráficos comparativos dinâmicos de temperatura e umidade.
- **Paho MQTT**: Biblioteca WebSocket para publicação e atualização de telemetria MQTT em tempo real.

## Como Executar o Projeto
1. Faça o clone do repositório ou descompacte os arquivos do projeto.
2. Abra o arquivo `index.html` em qualquer navegador web moderno.
3. Certifique-se de estar conectado à internet para o carregamento do Chart.js, Paho MQTT e para a realização das chamadas REST.

## Como Configurar a API Key
1. Cadastre-se gratuitamente na plataforma [OpenWeatherMap](https://openweathermap.org/).
2. Obtenha a sua API Key no seu painel de usuário.
3. Abra o arquivo `app.js` e substitua a constante `API_KEY` pela sua chave:
   ```javascript
   const API_KEY = "SUA_CHAVE_AQUI";
