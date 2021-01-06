console.log("server.js Last modified: 2021/01/06 22:57:26");

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

function enter(socket, nickname) {
  var playerId = socket.id;
  var roomID = socket.room;
  console.log("room: " + JSON.stringify(io.sockets.adapter.rooms[roomID]));
  io.sockets.to(playerId).emit('setPlayerId', playerId);
  if (!io.sockets.adapter.rooms[roomID].gameMaster) {
    io.sockets.adapter.rooms[roomID].gameMaster = playerId;
    io.sockets.to(playerId).emit('makeGameMaster');
  }
  if (!io.sockets.adapter.rooms[roomID].gameType) {
    io.sockets.adapter.rooms[roomID].gameType = 1;
  }

  if (!io.sockets.adapter.rooms[roomID].seats) {
    io.sockets.adapter.rooms[roomID].seats = new Array("");
  } else {
    io.sockets.adapter.rooms[roomID].seats.push("");
  }

  var playerObj = {
    id: playerId,
    nickname: nickname
  };
  if (!io.sockets.adapter.rooms[roomID].players) {
    io.sockets.adapter.rooms[roomID].players = new Array(playerObj);
  } else {
    io.sockets.adapter.rooms[roomID].players.push(playerObj);
  }
  console.log("@@@  @@@: " + JSON.stringify(io.sockets.adapter.rooms[roomID]));
  io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[roomID]);
}

function leave(room, playerId) {
  console.log("Todo: Implement Game Leaving Logic");
  if (!room.gameMaster) {
    console.log("Todo: Assign New GameMaster");
  }
  //??room.seated.remove(playerId);
  //??room.players.remove(playerId);
  //??sockets.remove(playerId);
}

function setNickname(socket, playerId, nickname, triggerUpdate = false) {
  console.log("server setNickname... playerId: " + playerId + "   nickname: " + nickname);
  var room = io.sockets.adapter.rooms[socket.room];
  for (var i = 0; i < room.players.length; i++) {
    if (room.players[i].id == playerId) {
      io.sockets.adapter.rooms[socket.room].players[i].nickname = nickname;
    }
  }
  if (triggerUpdate) {
    console.log("server setNickname now Update...");
    io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[socket.room]);
  }
}

function setGameType(socket, gameType) {
  io.sockets.adapter.rooms[socket.room].gameType = gameType;
  io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[socket.room]);
}

function sit(socket, seatIndex, playerId) {
  io.sockets.adapter.rooms[socket.room].seats[seatIndex] = playerId;
  io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[socket.room]);
}

function stand(room, playerId) {
  var seatIndex = room.seats.indexOf(playerId);
  if (seatIndex > -1) {
    room.seats.splice(seatIndex, 1);
  }
  io.sockets.to(socket.room).emit('updateRoom', room);
}

io.sockets.on('connection', function (socket) {
  //Room State
  socket.on('enterRoom', function (data) {
    console.log("===========enterRoom" + JSON.stringify(data));
    var thisRoom = io.sockets.adapter.rooms[data.roomID];
    if (!thisRoom || thisRoom.length < maximumRoomSize) {
      
      console.log("===========enterRoom: has size");
      var nameIsAvailable = true;
      if (thisRoom && thisRoom.players) {
        console.log("===========enterRoom: has some players");
        for (var i = 0; i < thisRoom.players.length; i++) {
          if (thisRoom.players[i].nickname && thisRoom.players[i].nickname == data.username) {
            nameIsAvailable = false;
          }
        }
      }
      if (nameIsAvailable) {
        console.log("===========enterRoom: name available");
        console.log("thisRoom all good: " + thisRoom);
        //console.log("socket: " + JSON.stringify(socket, getCircularReplacer()));
        socket.join(data.roomID);
        socket.room = data.roomID;
        socket.nickname = data.username;
        enter(socket, data.username);
      } else {
        console.log("===========enterRoom: name taken");
        io.sockets.to(socket.id).emit('nameTaken');
      }
    } else {
      console.log("thisRoom is full? " + JSON.stringify(io.sockets.adapter.rooms[data.roomID]));
      io.sockets.to(socket.id).emit('fullRoom', thisRoom.length);
    }
  });
  socket.on('leaveRoom', function (roomID) {
    socket.leave(roomID);
    var thisRoom = io.sockets.adapter.rooms[roomID];
    if (thisRoom) {
      var nickname = socket.nickname === undefined ? 'Someone' : socket.nickname;
      io.sockets.to(roomID).emit('leftInGame', nickname);
    }
    io.sockets.to(roomID).emit('updateRoom', io.sockets.adapter.rooms[roomID]);
  });
  socket.on('playerSit', function (data) {
    var thisRoom = io.sockets.adapter.rooms[socket.room];
    console.log("playerSit... data: " + JSON.stringify(data));
    console.log("playerSit... socket.room: " + JSON.stringify(socket.room));
    console.log("playerSit... thisRoom: " + JSON.stringify(thisRoom));
    console.log("playerSit... socket.id: " + JSON.stringify(socket.id));

    if (socket.id == data.playerId || socket.id == thisRoom.gameMaster) {
      setNickname(socket, data.playerId, data.nickname);
      sit(socket, data.seatIndex - 1, data.playerId, data.nickname);
    } else {
      console.log("unauthorized sit");
    }
  });
  socket.on('setNickname', function (nickname) {
    console.log("$$$$$$$$$$$$$$$$$$$$      setNickname...: " + JSON.stringify(nickname));
    setNickname(socket, socket.id, nickname, true);
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
  socket.on('sendMessage', function (data) {
    io.sockets.to(socket.room).emit('message', data);
  });
  socket.on('setMaxRoomSize', function (data) {
    maximumRoomSize = data;
  });
  socket.on('setGameType', function (gameType) {
    setGameType(socket, gameType);
  });
  //Pregame
  socket.on('assignShortName', function (data) {
    io.sockets.to(socket.room).emit('assignShortNameToClients', data);
  });
  socket.on('cycleOrderIcon', function (data) {
    io.sockets.to(socket.room).emit('cycleClientOrderIcon', data);
  });
  socket.on('cycleAssignee', function (data) {
    io.sockets.to(socket.room).emit('cycleClientOrderAssignee', data);
  });
  socket.on('taskDrawn', function (card) {
    io.sockets.to(socket.room).emit('taskDrawn', card);
  });
  socket.on('hideTasks', function () {
    io.sockets.to(socket.room).emit('hideTasks');
  });
  socket.on('restartGame', function () {
    io.sockets.to(socket.room).emit('restartGame');
  });
  //Game Play
  socket.on('startGameOnServer', function (gameType) {
    console.log("---startGameOnServer----");
    var startGamePlayerCount = io.sockets.adapter.rooms[socket.room].length;
    console.log("---startGameOnServer---- startGamePlayerCount" + startGamePlayerCount);
    io.sockets.to(socket.room).emit('updateRoom', io.sockets.adapter.rooms[socket.room]);
    io.sockets.to(socket.room).emit('startGame', {
      playerCount: startGamePlayerCount,
      gameType: gameType
    });
  });

  socket.on('dealCards', function (data) {
    io.sockets.to(socket.room).emit('dealToClients', data);
  });
  socket.on('bid', function (data) {
    io.sockets.to(socket.room).emit('some1Bid', data);
  });
  socket.on('pass', function () {
    io.sockets.to(socket.room).emit('some1Passed');
  });
  socket.on('declareSuit', function (suit) {
    io.sockets.to(socket.room).emit('declareSuit', suit);
  });
  socket.on('orderUp', function () {
    io.sockets.to(socket.room).emit('orderUp');
  });
  socket.on('playCard', function (data) {
    io.sockets.to(socket.room).emit('cardPlayed', data);
  });
  socket.on('winner', function (data) {
    io.sockets.to(socket.room).emit('winnerOfRound', data);
  });
  socket.on('communicateCard', function (data) {
    io.sockets.to(socket.room).emit('communicateCard', data);
  });
  socket.on('setMission', function (data) {
    io.sockets.to(socket.room).emit('setMission', data);
  });
  socket.on('setHand', function (data) {
    io.sockets.to(socket.room).emit('setHand', data);
  });
  socket.on('cardDrawn', function (data) {
    io.sockets.to(socket.room).emit('cardDrawn', data);
  });
  socket.on('submitVote', function (data) {
    io.sockets.to(socket.room).emit('voteSubmitted', data);
  });

});