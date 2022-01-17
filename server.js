const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/status', (request, response) => response.json({ clients: clients.length }));

const PORT = 3001;

let clients = [];
let events = [];

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(events)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}


function sendEventsToAll(event) {
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(event)}\n\n`));
}

async function proxyEvent(request, response, next) {
  const event = request.body;
  console.log({ event });
  events.push(event);
  response.json({ success: true });

  return sendEventsToAll(event);
}

app.get('/events', eventsHandler);
app.post('/event', proxyEvent);
app.listen(PORT, () => {
  console.log(`Events service listening at http://localhost:${PORT}`)
})