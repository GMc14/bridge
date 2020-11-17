function initPlayerModule() {
  console.log("--------------initPlayerModule----------------");
  if (playerModuleIsShowing) {
    console.log("-------------- Been Hee Before ----------------");
    return;
  }
  playerModuleIsShowing = true;
  clearSetupModule();
  var teamInfo = '';
  if (gameConfig_hasTeams) {
    teamInfo = "(TEAMS: 1 & 3 and 2 & 4)"
  }

  $(".setupModule:eq(0)").append("<div id='playerSetup'></div>");
  $("#playerSetup").append($("<span class='seatSelectionLabel' id='nicknameLabel'>NICKNAME:</span>"));
  $("#playerSetup").append($("<input id='nicknameInput' type='text'></input>"));
  $("#playerSetup").append($("<span class='seatSelectionLabel' id='playerSelectLabel'>SELECT SEAT:" + teamInfo + "</span>"));
  $("#playerSetup").append($("<div id='seatingArea'></div>"));
  var previousNickName = $.cookie("nickname");
  if (previousNickName) {
    $("#nicknameInput").val(previousNickName);
  }
  if (isGameMaster) {
    console.log("--------------<({[isGameMaster]})>----------------");
    $("#startGameButton").show();
    $("#startGameButton").on("click", function () {
      if (isOkayToStartTheGame()) {
        socketio.emit('startGameOnServer');
      } else {
        alert("Problematic Open Seats");
      }
    });
  }
}
function applySeatButtonClickListener() {
  $(".playerBtns").on("click", function () {
    console.log("--------------playerBtns Click----------------");
    playerNum = $(this).val();
    nickname = String($("#nicknameInput").val());
    seatIndex = Number($(this).attr("data-player-number"));
    console.log("playerSelect >> playerNum: " + playerNum + "  >> nickname: " + nickname + "  >>  seatIndex: " + seatIndex);
    if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
      alert('Pick a unique Nickname!');
    } else {
      $("#myName").append(playerNum + ": " + nickname);
      $.cookie("nickname", nickname);
      console.log("--------------playerBtns emit playerSit...----------------");
      socketio.emit('playerSit', {
        nickname: nickname,
        seatIndex: seatIndex,
        playerId: clientPlayerId
      });
      //TODO: show chat if want to use it $('#chat').show();
      playerColor = playerColors[seatIndex - 1];
      $(".playerBtns").prop('disabled', true);
      $("#nicknameInput").prop('disabled', true);
    }
  });
}
function addSeatToTable(seatNumber) {
  if (seatNumber < 0) {
    console.log("--------------addSeatToTable ----------------: invalid seat: " + seatNumber);
    return;
  }
  console.log("--------------addSeatToTable ----------------: " + seatNumber);
  if ($("#btnPlayer" + seatNumber).length < 1) {
    var seatButton = document.createElement("input");
    seatButton.setAttribute("type", "button");
    seatButton.setAttribute("id", "btnPlayer" + seatNumber);
    seatButton.setAttribute("data-player-number", seatNumber);
    seatButton.setAttribute("class", "playerBtns");
    seatButton.setAttribute("value", "Player" + seatNumber);
    $("#seatingArea").append(seatButton);
  }
}
function joinRoom() {
  console.log("--------joinRoom-----------");
  roomID = $("#roomID").val();
  while (roomID.length < 4) {
      roomID = roomID.concat(codeCandidates.charAt(Math.floor(Math.random() * codeCandidates.length)));
  }
  roomID = roomID.toUpperCase()
  socketio.emit('enterRoom', roomID);
  clearSetupModule();
  var roomText = document.createElement("span");
  roomText.setAttribute("id", "roomText");
  roomText.appendChild(document.createTextNode("Room Code: " + roomID));
  $("#topbar").prepend(roomText);
  $("#leaveRoom").show();
}
function leaveRoom() {
  socketio.emit('leaveRoom', roomID);
  $("#leaveRoom").hide();
  // $("#roomText").remove();
  // clearSetupModule();
  // roomModule();
  window.location.reload();

}

$(function () {
  $("#joinRoomForm").on('submit', function (e) {
    e.preventDefault();
    joinRoom();
  });
  socketio.on('updateRoom', function (room) {
    roomState = room;
    console.log("--------updateRoom-----------" + JSON.stringify(roomState));
    gameConfig_playerCount = roomState.players.length;

    initPlayerModule();
    console.log("--------updateRoom ------roomState.players-----" + JSON.stringify(roomState.players));
    var standingPlayersHTMLString = "Waiting for... <br />";
    $("#seatingArea").empty();

    var counter = 1;
    $.each(roomState.players, function () {
      addSeatToTable(counter);
      counter = counter + 1;
    });
    applySeatButtonClickListener();
    $.each(roomState.players, function () {
      var nickname = this.nickname;
      if (nickname.length <= 0) {
        nickname = this.id;
      }
      var seatIndex = roomState.seats.indexOf(this.id) + 1;
      console.log("--------seatIndex-----------" + seatIndex + "  for:" + this.id);
      console.log("--------roomState.seats-----------" + JSON.stringify(roomState.seats));
      if (seatIndex < 1) {

        console.log("--------seatIndex Add em to the queue-----------" + seatIndex + "  for:" + this.id);
        standingPlayersHTMLString = standingPlayersHTMLString.concat(nickname);
        standingPlayersHTMLString = standingPlayersHTMLString.concat("<br />");
      } else {
        console.log("--------seat " + nickname + " at the table-----------" + seatIndex + "  for:" + this.id);
        $("#btnPlayer" + seatIndex).val(nickname);
        $("#btnPlayer" + seatIndex).prop('disabled', true);
        playerNickNames[seatIndex - 1] = nickname;
      }
    });
    $("#playersInRoom").html(standingPlayersHTMLString);
  });
  socketio.on('setPlayerId', function (playerId) {
    clientPlayerId = playerId;
  });
  socketio.on('fullRoom', function () {
    console.log("--------fullRoom-----------");
    alert("Room is Full. Try Again Later");
  });

});