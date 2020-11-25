const roomCodeCandidates = "234689ABCEFJKMNPQRTVWXY";
const playerColors = ['#004499', '#770011', '#666600', '#116600', '#440099', '#883300', '#006666', '#660066'];
var playerModuleIsShowing = false;
var playerNickNames = ['', '', '', '', '', '', '', ''];

function initPlayerModule() {
  console.log("--------------initPlayerModule----------------");
  if (playerModuleIsShowing) {
    console.log("-------------- Been Hee Before ----------------");
    return;
  }
  playerModuleIsShowing = true;

  setGameType($("#gameDrop").val());
  $("#teamInfo").toggle(gameConfig_hasTeams);
  $("#gameDrop").toggle(isGameMaster);
  $("#gameDrop").change(function () {
    $("#teamInfo").toggle(gameConfig_hasTeams);
    setGameType($("#gameDrop").val());
    socketio.emit('setGameType', gameType);
  });

  var previousNickName = $.cookie("nickname");
  if (previousNickName) {
    $("#nicknameInput").val(previousNickName);
    console.log("--------------previousNickName----------------"+previousNickName);
    socketio.emit('setNickname', previousNickName);
  }

  $("#startGameButton").toggle(isGameMaster);
  $("#startGameButton:visible").on("click", function () {
    if (isOkayToStartTheGame()) {
      socketio.emit('startGameOnServer', gameType);
    } else {
      alert("Problematic Open Seats");
    }
  });
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
    var seatButton = $("<input type='button' class='playerBtns'></input>");
    $(seatButton).attr("id", "btnPlayer" + seatNumber)
    $(seatButton).attr("data-player-number", seatNumber);
    $(seatButton).attr("value", "Player" + seatNumber);
    $("#seatingArea").append(seatButton);
  }
}

function joinRoom() {
  console.log("--------joinRoom-----------");
  roomID = $("#roomID").val();
  while (roomID.length < 4) {
    roomID = roomID.concat(roomCodeCandidates.charAt(Math.floor(Math.random() * roomCodeCandidates.length)));
  }
  roomID = roomID.toUpperCase()
  socketio.emit('enterRoom', roomID);

  $("#roomText").html("<b>Room: </b>" + roomID);
  $("#topbar").show();
  $("#leaveRoom").show();
  $("#playerSetup").show();
  //$("#chat").show();
  $("#roomSelection").hide();
}

function leaveRoom() {
  socketio.emit('leaveRoom');
  $("#leaveRoom").hide();
  // $("#roomText").remove();
  // roomModule();
  window.location.reload();
}

function isOkayToStartTheGame() {
  var lowestOpen = 999;
  var highestReadied = 0;
  $('.playerBtns').each(function () {
    var number = Number($(this).data("player-number"));
    var isReadied = $(this).prop("disabled");
    console.log("P#:" + number);
    if (isReadied && number > highestReadied) {
      highestReadied = number;
    }
    if (!isReadied && number < lowestOpen) {
      lowestOpen = number;
    }
  });

  var isOkay = lowestOpen > highestReadied &&
    highestReadied >= gameConfig_minPlayerCount &&
    highestReadied <= gameConfig_maxPlayerCount;

  console.log("gameConfig_minPlayerCount: " + gameConfig_minPlayerCount + "   gameConfig_maxPlayerCount: " + gameConfig_maxPlayerCount);
  console.log("A: " + (lowestOpen > highestReadied) + "   B: " + (highestReadied >= gameConfig_minPlayerCount) + "  C: " + (highestReadied <= gameConfig_maxPlayerCount));
  console.log("LO: " + lowestOpen + "   HR: " + highestReadied + "  okay? " + isOkay);
  return isOkay;
}

function scrollToChatBottom() {
  var divObj = $("#msgBox");
  divObj.scrollTop($(divObj)[0].scrollHeight);
}
$(function () {
  $("#joinRoomForm").on('submit', function (e) {
    e.preventDefault();
    joinRoom();
  });
  $("#missionNumberInput").change(function () {
    socketio.emit('setMission', $(this).val());
    $("#handNumberInput").val(0);
  });
  $("#handNumberInput").change(function () {
    socketio.emit('setHand', $(this).val());
  });
  $("#missionNumberInput").val(1);
  socketio.on('setPlayerId', function (playerId) {
    clientPlayerId = playerId;
  });
  socketio.on('fullRoom', function () {
    console.log("--------fullRoom-----------");
    alert("Room is Full. Try Again Later");
  });
  socketio.on('message', function (data) {
    var msg = data.msg;
    var nickname = data.nickname;
    $("#msgBox").append("<span><b>" + nickname + ":</b>&emsp;" + msg + "</span><br><br>");
    scrollToChatBottom();
    $('#boxBottom').show();
  });
});
function applyTableCloth(tableCloth){
  if (tableCloth) {
    $("body").css("background-image", "url('" + tableCloth + "')");
    $("body").css("background-size", "cover");
  } else {
    $("body").css('background-image', '');
    $("body").css("background-size", "20px 20px");
  }
}
function updateRoom(room) {
  roomState = room;
  console.log("--------updateRoom-----------" + JSON.stringify(roomState));
  if (roomState.gameType) {
    setGameType(roomState.gameType);
    $("#gameNameText").html("<b>Game: </b>" + gameConfig_gameName);
  }
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
  $(startGameButton).prop("disabled", !isOkayToStartTheGame());
}

function getNicknameForPlayer(player) {
  var myPIndex = Number(player.slice(-1)) - 1;
  return playerNickNames[myPIndex];
}