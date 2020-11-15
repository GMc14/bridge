var maximumRoomSize = 10;
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
console.log("server running on Port " + PORT);
var io = socketio.listen(server);

io.sockets.on('connection', function (socket) {
  //Room State
  socket.on('enterRoom', function (room) {
    var thisRoom = io.sockets.adapter.rooms[room];
    var numInRoom = thisRoom === undefined ? 0 : thisRoom.length;
    if (numInRoom >= maximumRoomSize) {
      io.sockets.to(socket.id).emit('fullRoom', numInRoom);
    } else {
      socket.join(room);
      socket.room = room;
      numInRoom++;
      io.sockets.to(room).emit('setPlayerCountOnClient', numInRoom);
      thisRoom = io.sockets.adapter.rooms[room];
      console.log("room: " + JSON.stringify(room));
      console.log("thisRoom: " + JSON.stringify(thisRoom));

      if (thisRoom && !thisRoom.gameMaster) {
        thisRoom.gameMaster = socket.id;
        io.sockets.to(socket.id).emit('makeGameMaster');
      }
    }
  });
  socket.on('leaveRoom', function (room) {
    socket.leave(room);
    var thisRoom = io.sockets.adapter.rooms[room];
    var numInRoom = thisRoom === undefined ? 0 : thisRoom.length;
    io.sockets.to(room).emit('setPlayerCountOnClient', numInRoom);
    if (thisRoom) {
      if (thisRoom.inGame == 1) {
        var nickname = socket.nickname === undefined ? 'Someone' : socket.nickname;
        io.sockets.to(room).emit('leftInGame', nickname);
      }
      io.sockets.to(room).emit('setPlayerCountOnClient', thisRoom.length);
    }
  });
  socket.on('playerSeated', function (data) {
    console.log("playerSeated... data: " + JSON.stringify(data));
    console.log("playerSeated... socket.room: " + JSON.stringify(socket.room));
    io.sockets.adapter.rooms[data.roomID].inGame = 1;
    var playerIndex = data.playerIndex;
    socket.nickname = data.nickname;
    socket.player = data.playerNum;
    console.log("--------------playerSeated------  >>  playerIndex: " + playerIndex +" socket.player: "+socket.player +" socket.nickname: "+socket.nickname);
    io.sockets.to(data.roomID).emit('playerDataToClient', {
      nickname: socket.nickname,
      playerIndex: playerIndex
    });
  });
  socket.on('playerUnseated', function (data) {
    console.log("playerUnseated... data: " + JSON.stringify(data));
    console.log("playerUnseated... socket.room: " + JSON.stringify(socket.room));

  });
  socket.on('startGameOnServer', function () {
    console.log("---startGameOnServer----");
    var startGamePlayerCount = io.sockets.adapter.rooms[socket.room].length;
    console.log("---startGameOnServer---- startGamePlayerCount" + startGamePlayerCount);
    io.sockets.to(socket.room).emit('setPlayerCountOnClient', startGamePlayerCount);
    io.sockets.to(socket.room).emit('startGame', startGamePlayerCount);
  });
  socket.on('sendMessage', function (data) {
    io.sockets.to(socket.room).emit('message', data);
  });
  socket.on('setMaxRoomSize', function (data) {
    maximumRoomSize = data;
  });
  //Pregame
  socket.on('assignShortName', function (data) {
    io.sockets.to(socket.room).emit('assignShortNameToClients', data);
  });
  socket.on('cycleOrderIcon', function (data) {
    io.sockets.to(data.roomID).emit('cycleClientOrderIcon', data);
  });
  socket.on('cycleAssignee', function (data) {
    io.sockets.to(data.roomID).emit('cycleClientOrderAssignee', data);
  });
  socket.on('drawTask', function (card) {
    console.log("drawTask... socket.room: " + JSON.stringify(socket.room));
    io.sockets.to(socket.room).emit('drawTask', card);
  });
  socket.on('hideTasks', function () {
    io.sockets.to(socket.room).emit('hideTasks');
  });
  socket.on('restartGame', function () {
    io.sockets.to(socket.room).emit('restartGame');
  });
  //Game Play
  socket.on('dealCards', function (data) {
    io.sockets.to(data.roomID).emit('dealToClients', data);
  });
  socket.on('bid', function (data) {
    io.sockets.to(socket.room).emit('some1Bid', data);
  });
  socket.on('pass', function () {
    io.sockets.to(socket.room).emit('some1Passed');
  });
  socket.on('playCard', function (data) {
    io.sockets.to(data.roomID).emit('cardPlayed', data);
  });
  socket.on('winner', function (data) {
    io.sockets.to(data.roomID).emit('winnerOfRound', data);
  });
});