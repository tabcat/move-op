import net from 'net'
import type { LogMove } from '../src/algorithm';

const clients = new Set<net.Socket>()
const log_operations = new Map<string, LogMove<number, string, string>>()

const server = net.createServer((socket) => {
  console.log('Client connected');
  clients.add(socket)

  socket.on('data', (data) => {
    const message: LogMove<number, string, string>[]= JSON.parse(data.toString())

    for (const op of message) {
      log_operations.set(op.child, op)
    }

    for (const client of clients) {
      client.write(JSON.stringify([...log_operations.values()]))
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
    clients.delete(socket)
  });
});

server.listen(8124, () => {
  console.log('Server bound to port 8124');
  console.log('start some clients')
});
