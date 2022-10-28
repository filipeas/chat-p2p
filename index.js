require('dotenv/config');
const sha = require('sha256');
const Peer = require('./Peer');

if (!process.env.PORT) {
  throw Error("Variável de ambiente PORT não informada");
}

const port = process.env.PORT;
console.log("Porta: ", port);

const timestamp = Date.now();
const randomNumber = Math.floor((Math.random() * 10000) + 1000)
const myKey = sha(port + "" + timestamp + "" + randomNumber);

const receivedMessageSignatures = [];

const peer = new Peer(port);

process.argv.slice(2).forEach(otherPeerAddress => peer.connectTo(otherPeerAddress));

peer.onConnection = socket => {
  const message = "Olá! Estou na porta: " + port;

  const signature = sha(message + myKey + Date.now());
  receivedMessageSignatures.push(signature);

  const firstPayload = {
    signature,
    message
  };

  socket.write(JSON.stringify(firstPayload));
};

peer.onData = (socket, data) => {
  const json = data.toString();
  const payload = JSON.parse(json);

  if (receivedMessageSignatures.includes(payload.signature)) {
    return;
  }

  receivedMessageSignatures.push(payload.signature);
  console.log("recebido > ", payload.message);
  peer.broadcast(json);
};

process.stdin.on('data', data => {
  const message = data.toString().replace(/\n/g, "");
  const signature = sha(message + myKey + Date.now());

  receivedMessageSignatures.push(signature);

  peer.broadcast(JSON.stringify({ signature, message }));
});