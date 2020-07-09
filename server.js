var http = require("http"),
  socketio = require("socket.io"),
  fs = require("fs"),
  path = require("path"),
  PORT = process.env.PORT || 1234;

var server = http.createServer(function (req, res) {

  var filePath = req.url;

  if (filePath == '/') {
    filePath = './index.html';
  }

  filePath = "./" + filePath;
  var extname = path.extname(filePath);
  var contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
  }

  fs.exists(filePath, function (exists) {

    if (exists) {

      fs.readFile(filePath, function (err, data) {
        if (err) {
          return res.writeHead(500);
        } else {
          res.writeHead(200, {
            'Content-Type': contentType
          });
          res.end(data);
        }
      });
    }

  });

}).listen(PORT);
console.log("server running on Port 1234");

var io = socketio.listen(server);
io.sockets.on('connection', function (socket) {
  socket.on('create', function (room) {
    var thisRoom = io.sockets.adapter.rooms[room];
    var numInRoom = thisRoom === undefined ? 0 : thisRoom.length;
    if (numInRoom >= 4) {
      io.sockets.to(socket.id).emit('fullRoom', numInRoom);
    } else {
      socket.join(room);
      socket.room = room;
      numInRoom++;
      io.sockets.to(room).emit('wait4Players', numInRoom);
    }
  });
  socket.on('leave', function (room) {
    socket.leave(room);
    var thisRoom = io.sockets.adapter.rooms[room];
    var numInRoom = thisRoom === undefined ? 0 : thisRoom.length;
    io.sockets.to(room).emit('wait4Players', numInRoom);
    if (io.sockets.adapter.rooms[room].inGame == 1) {
      var nickname = socket.nickname === undefined ? 'Someone' : socket.nickname;
      io.sockets.to(room).emit('leftInGame', nickname);
    }
  });
  socket.on('selPlayer', function (data) {
    io.sockets.adapter.rooms[data.roomID].inGame = 1;
    socket.nickname = data.nickname;
    var playerNum = data.playerNum;
    socket.player = playerNum;
    var pLeft = data.pLeft;
    console.log(pLeft);
    io.sockets.to(data.roomID).emit('playerDataToClient', {
      nickname: socket.nickname,
      player: playerNum,
      pLeft: pLeft
    });

    if (pLeft == 0) {
      io.sockets.to(data.roomID).emit('startGame');
    }

  });
  socket.on('dealCards', function (data) {
    io.sockets.to(data.roomID).emit('deal', {
      hands: data.hands,
      trumpCard: data.trumpCard
    });
  });
  socket.on('playCard', function (data) {
    io.sockets.to(data.roomID).emit('cardPlayed', {
      player: socket.player,
      card: data.card
    });
  });
  socket.on('winner', function (data) {
    console.log("server:->winner");
    io.sockets.to(data.roomID).emit('winnerOfRound', data.player, data.trickCards);
  });
  socket.on('bid', function (data) {
    io.sockets.to(socket.room).emit('some1Bid', data);
  });
  socket.on('pass', function () {
    io.sockets.to(socket.room).emit('some1Passed');
  });
  socket.on('restartGame', function () {
    io.sockets.to(socket.room).emit('restartGame');
  });
  socket.on('sendMessage', function (data) {
    io.sockets.to(socket.room).emit('message', data);
  });
});