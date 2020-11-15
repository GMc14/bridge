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

function enter(room, socket) {
  var playerId = socket.id;
  console.log("room: " + JSON.stringify(room));
  if (!room.gameMaster) {
    room.gameMaster = playerId;
  }
  if (!room.seats) {
    room.seats = new Array({
      occupant: ""
    });
  }
  if (!room.standing) {
    room.standing = new Array(playerId);
  }
  if (!room.players) {
    room.players = new Array({
      id: playerId
    });
  }
  console.log("@@@ enter room @@@: " + JSON.stringify(room));
  io.sockets.to(socket.room).emit('updateRoom', room);
}

function leave(room, playerId) {
  if (!room.gameMaster) {
    console.log("Todo: Assign New GameMaster");
  }
  room.standing.remove(playerId);
  room.seated.remove(playerId);
}

function sit(room, playerId, seatIndex) {
  room.standing.remove(playerId);
  room.seated.add(playerId);
}

function stand(room, playerId) {
  //room.standing.add(playerId);
  //room.seated.remove(playerId);
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

io.sockets.on('connection', function (socket) {
  //Room State
  socket.on('enterRoom', function (roomID) {
    var thisRoom = io.sockets.adapter.rooms[roomID];
    if (!thisRoom || thisRoom.length < maximumRoomSize) {
      console.log("thisRoom all good: " + thisRoom);
      //console.log("socket: " + JSON.stringify(socket, getCircularReplacer()));
      socket.join(roomID);
      thisRoom = io.sockets.adapter.rooms[roomID]; 
      console.log("thisRoom all good: " + thisRoom);//should exist now
      socket.room = roomID;
      enter(thisRoom, socket);
    } else {
      console.log("thisRoom? "+thisRoom);
      //io.sockets.to(socket.id).emit('fullRoom', thisRoom.length);
    }
  });
  socket.on('leaveRoom', function (roomID) {
    socket.leave(roomID);
    var thisRoom = io.sockets.adapter.rooms[roomID];
    if (thisRoom) {
      if (thisRoom.inGame == 1) {
        var nickname = socket.nickname === undefined ? 'Someone' : socket.nickname;
        io.sockets.to(roomID).emit('leftInGame', nickname);
      }
    }
    io.sockets.to(roomID).emit('updateRoom', io.sockets.adapter.rooms[roomID]);
  });
  socket.on('playerSit', function (data) {
    console.log("playerSeated... data: " + JSON.stringify(data));
    console.log("playerSeated... socket.room: " + JSON.stringify(socket.room));
    io.sockets.adapter.rooms[data.roomID].inGame = 1;
    var playerIndex = data.playerIndex;
    socket.nickname = data.nickname;
    socket.player = data.playerNum;
    console.log("--------------playerSeated------  >>  playerIndex: " + playerIndex + " socket.player: " + socket.player + " socket.nickname: " + socket.nickname);
    io.sockets.to(data.roomID).emit('playerDataToClient', {
      nickname: socket.nickname,
      playerIndex: playerIndex
    });
  });
  socket.on('playerStand', function (player) {
    console.log("playerUnseated... data: " + JSON.stringify(data));
    console.log("playerUnseated... socket.room: " + JSON.stringify(socket.room));
    if (socket == player || socket == room.gameMaster) {
      stand(socket.room, player);
    } else {
      console.log("unauthorized seat kick");
    }
  });
  socket.on('startGameOnServer', function () {
    console.log("---startGameOnServer----");
    var startGamePlayerCount = io.sockets.adapter.rooms[socket.room].length;
    console.log("---startGameOnServer---- startGamePlayerCount" + startGamePlayerCount);
    io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[socket.room]);
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