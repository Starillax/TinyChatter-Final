const express = require('express');
const app = express();

app.use(express.static('public/index.html'));
app.use(express.urlencoded({
    extended: true,
}));

app.set('view engine', 'ejs');
app.set('views', './src/views');

// ATENCAO
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const connectedUsers = [];

io.on('connection', (socket) => {
    socket.client.nick = '';

    socket.on('user connection', (msg) => {
        socket.client.nick = msg;
        console.log(socket.client.id + ' connected');
        connectedUsers.push([socket.client.id, socket.client.nick]);
        io.emit('chat message', socket.client.nick + ' se conectou');
        //io.emit('connected users', Object.keys(io.engine.clients));
        io.emit('connected users', connectedUsers);
    });

    socket.on('chat message', (msg) => {
        console.log('sid: ' + socket.client.id + '\tmessage: ' + msg);
        io.emit('chat message', socket.client.nick + ' disse: ' + msg);
    });

    socket.on('set nick', (msg) => {
        const oldNick = socket.client.nick
        io.emit('chat message', `${oldNick} trocou seu nome para ${msg}`);
        for (let i = 0; i < connectedUsers.length; i++) {
            if (connectedUsers[i][0] === socket.client.id) {
                connectedUsers[i][1] = msg;
            }
        }
        socket.client.nick = msg;
        io.emit('connected users', connectedUsers);
    });

    socket.on('disconnect', () => {
        console.log(socket.client.id + ' disconnected');
        io.emit('chat message', socket.client.nick + ' se desconectou');
        for (let i = 0; i < connectedUsers.length; i++) {
            if (connectedUsers[i][0] === socket.client.id) {
                connectedUsers.splice(i, 1);
            }
        }
        io.emit('connected users', connectedUsers);
    });
});

app.get('/', (req, res) => {
  return res.render('login');
});

app.post('/index', (req, res) => {
  const { nick } = req.body;

  res.render('index', {iniNick: nick});
});

server.listen(8080, () => {
    console.log('listening on *:8080');
});