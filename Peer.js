const net = require('net');

module.exports = class Peer {
  constructor(port) {
    this.port = port;
    this.connections = [];

    const server = net.createServer((socket) => {
      this.onSocketConnected(socket);
    });

    server.listen(port, () => console.log("Ouvindo porta: " + port));
  }

  connectTo(address) {
    if (address.split(':').length !== 2) {
      throw Error("O endereço do outro peer deve ser composto por HOST:PORT");
    }

    const [host, port] = address.split(':');

    const socket = net.createConnection({ port, host }, () => this.onSocketConnected(socket));
  }

  onSocketConnected(socket) {
    this.connections.push(socket);

    socket.on('data', (data) => this.onData(socket, data));

    socket.on('close', () => {
      this.connections = this.connections.filter(conn => {
        return conn !== socket;
      });
    });

    this.onConnection(socket);
  }

  onConnection(socket) { }

  onData(socket, data) {
    console.log("recebido: ", data.toString());
  }

  broadcast(data) {
    this.connections.forEach(socket => socket.write(data));
  }
}