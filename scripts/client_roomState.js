const lastModifiedString6 = ("Last modified: 2021/01/09 02:22:06");
const roomTS = lastModifiedString6.replace("Last ", "").replace("modified: ", "");
console.log("client_roomState.js " + lastModifiedString6);

var cardback = "card_imgs/cardback.png";
var path = window.location.pathname;
console.log("window.location.pathname: " + path);

const roomCodeCandidates = "234689ABCEFJKMNPQRTVWXY";
const playerColors = ['#770011', '#883300', '#666600', '#116600', '#006666', '#004499', '#440099', '#660066', '#e6194b', '#f58231', '#ffe119', '#bcf60c', '#3cb44b', '#46f0f0', '#4363d8', '#911eb4', '#f032e6', '#ffbebe', '#ffd8b1', '#fafac8', '#aaffc3', '#aac3ff', '#e6beff', '#fac8fa', '#808080', '#ffffff', '#000000'];
var playerModuleIsShowing = false;
var playerNickNamesBySeatIndex = [];

function initPlayerModule() {
  console.log("--------------initPlayerModule----------------");
  if (playerModuleIsShowing) {
    console.log("-------------- Been Here Before ----------------");
    return;
  }
  playerModuleIsShowing = true;

  setGameType($("#gameDrop").val());
  $("#teamInfo").toggle(gameConfig_hasTeams);
  $("#gameDrop").toggle(isGameMaster);
  $("#gameDrop").change(function () {
    setGameType($("#gameDrop").val());
    $("#teamInfo").toggle(gameConfig_hasTeams);
    socketio.emit('setGameType', gameType);
  });

  $("#startGameButton").toggle(isGameMaster);
}

// function takeASeat(seatIndex) {
//   nickname = String($("#nicknameInput").val());
//   console.log("playerSelect >> client_playerNum: " + client_playerNum + "  >> nickname: " + nickname + "  >>  seatIndex: " + seatIndex);
//   if (nickname == '' || playerNickNamesBySeatIndex.indexOf(nickname) > -1) {
//     alert('Pick a unique Nickname!');
//   } else {
//     $("#myName").append(client_playerNum + ": " + nickname);
//     $.cookie("nickname", nickname);
//     console.log("--------------playerBtns emit playerSit...----------------");
//     socketio.emit('playerSit', {
//       nickname: nickname,
//       seatIndex: seatIndex,
//       playerId: clientPlayerId
//     });
//     //TODO: show chat if want to use it $('#chat').show();
//     playerColor = playerColors[seatIndex - 1];
//     $(".playerBtns").prop('disabled', true);
//     $("#nicknameInput").prop('disabled', true);
//   }
// }

// function applySeatButtonClickListener() {
//   $(".playerBtns").on("click", function () {
//     console.log("--------------playerBtns Click----------------");
//     client_playerNum = $(this).val();
//     takeASeat(Number($(this).attr("data-player-number")));
//   });
// }

// function addSeatToTable(seatNumber) {
//   if (seatNumber < 0) {
//     console.log("--------------addSeatToTable ----------------: invalid seat: " + seatNumber);
//     return;
//   }
//   console.log("--------------addSeatToTable ----------------: " + seatNumber);
//   if ($("#btnPlayer" + seatNumber).length < 1) {
//     var seatButton = $("<input type='button' class='playerBtns'></input>");
//     $(seatButton).attr("id", "btnPlayer" + seatNumber)
//     $(seatButton).attr("data-player-number", seatNumber);
//     $(seatButton).attr("value", "Player" + seatNumber);
//     $("#seatingArea").append(seatButton);
//   }
// }

function isOkayToStartTheGame(playerCount) {
  // if (!gameConfig_chooseSeats) {
  //   const playerCount = $('.playerBtns').length;
  //   console.log("isOkayToStartTheGame?? " + playerCount + " <> " + gameConfig_minPlayerCount);
  //   return playerCount >= gameConfig_minPlayerCount && playerCount <= gameConfig_maxPlayerCount
  // }
  // var lowestOpen = 999;
  // var highestReadied = 0;

  // $('.playerBtns').each(function () {
  //   var number = Number($(this).data("player-number"));
  //   var isReadied = $(this).prop("disabled");
  //   console.log("P#:" + number);
  //   if (isReadied && number > highestReadied) {
  //     highestReadied = number;
  //   }
  //   if (!isReadied && number < lowestOpen) {
  //     lowestOpen = number;
  //   }
  // });

  // var isOkay = lowestOpen > highestReadied &&
  //   highestReadied >= gameConfig_minPlayerCount &&
  //   highestReadied <= gameConfig_maxPlayerCount;

  // console.log("gameConfig_minPlayerCount: " + gameConfig_minPlayerCount + "   gameConfig_maxPlayerCount: " + gameConfig_maxPlayerCount);
  // console.log("A: " + (lowestOpen > highestReadied) + "   B: " + (highestReadied >= gameConfig_minPlayerCount) + "  C: " + (highestReadied <= gameConfig_maxPlayerCount));
  // console.log("LO: " + lowestOpen + "   HR: " + highestReadied + "  okay? " + isOkay);
  return playerCount >= gameConfig_minPlayerCount && playerCount <= gameConfig_maxPlayerCount;
}

function attemptJoinRoom() {
  console.log("--------attemptJoinRoom-----------");
  roomID = $("#roomID").val().toUpperCase();

  client_username = $("#nicknameInput").val();
  while (roomID.length < 4) {
    roomID = roomID.concat(roomCodeCandidates.charAt(Math.floor(Math.random() * roomCodeCandidates.length)));
  }
  roomID = roomID.toUpperCase();
  $("#roomID").val(roomID)
  socketio.emit('enterRoom', {
    username: client_username,
    roomID: roomID
  });
  $("#roomLoader").show();
}

function roomJoinedSuccess() {
  console.log("roomJoinedSuccess ---");
  $("#roomText").html("<b>Room: </b>" + $("#roomID").val());
  $("#topbar").show();
  // $("#leaveRoom").show();
  $("#playerSetup").show();
  //$("#chat").show();
  $("#roomSelection").hide();
  $("#roomLoader").hide();
}

function leaveRoom() {
  socketio.emit('leaveRoom');
  $("#leaveRoom").hide();
  // $("#roomText").remove();
  // roomModule();
  window.location.reload();
}

function scrollToChatBottom() {
  var divObj = $("#msgBox");
  divObj.scrollTop($(divObj)[0].scrollHeight);
}

function initSettings() {

  var i;
  for (i = 1; i <= 20; i++) {
    $("#cardBackChoices").append('<img class="cardBackOption" id="cardBackOption' + i + '" src="card_imgs/cardback_' +
      i + '.png">');
  }
  for (i = 1; i <= 4; i++) {
    $("#tableClothChoices").append('<img class="tableClothOption" id="tableClothOption' + i + '" src="table_imgs/bg' +
      i + '.jpg">');
  }
  $(".cardBackOption").click(function () {
    $(this).addClass('ui-selected').siblings().removeClass('ui-selected');
    let cardBackSrc = $(".cardBackOption.ui-selected").prop("src");
    $(".cardback").attr("src", cardBackSrc);
    $.cookie("selectedCardBack", $(this).prop('id'));
    console.log("Cookie: selectedCardBack" + $(this).prop('id'));
  });
  let previousCardBack = $.cookie("selectedCardBack");
  console.log("Cookie: previousCardBack" + previousCardBack);
  if (previousCardBack) {
    $("#" + previousCardBack).addClass('ui-selected').siblings().removeClass('ui-selected');
    cardBack = $("#" + previousCardBack).prop("src");
  }
  $(".tableClothOption").click(function () {
    $(this).addClass('ui-selected').siblings().removeClass('ui-selected');
    tableCloth = $(this).prop("src");
    applyTableCloth(tableCloth);
    $.cookie("selectedTableBackground", $(this).prop('id'));
    console.log("Cookie: selectedTableBackground" + $(this).prop('id'));
  });
  let previousTableBackground = $.cookie("selectedTableBackground");
  console.log("Cookie: previousTableBackground" + previousTableBackground);
  if (previousTableBackground) {
    $("#" + previousTableBackground).addClass('ui-selected').siblings().removeClass('ui-selected');;
    applyTableCloth($("#" + previousTableBackground).prop("src"));
  }
}
$(function () {
  $("#gameDrop").append($("<option value='" + GameType.CREW + "'>The Crew (1-5)</option>"));
  $("#gameDrop").append($("<option value='" + GameType.BRIDGE + "'>Bridge (4)</option>"));
  $("#gameDrop").append($("<option value='" + GameType.EUCHRE + "'>Euchre (3-4)</option>"));
  $("#gameDrop").append($("<option value='" + GameType.DIXIT + "'>Dixit (1-5)</option>"));
  $("#gameDrop").append($("<option value='" + GameType.WEREWOLF + "'>Werewolf (3-99)</option>"));
  initSettings();
  $("#helpLegendTrigger").click(function () {
    console.log("show THINGSSSS");
    $("#helpLegend").toggle();
  });
  $("#settingsTrigger").click(function () {
    console.log("show Settings");
    $("#settings").toggle();
  });
  $("#settings").click(function () {
    $("#settings").hide();
  });
  $("#helpLegend").click(function () {
    $("#helpLegend").hide();
  });
  $("#boxTop").on("click", function () {
    $('#boxBottom').toggle();
  });
  $('#textArea').bind('keyup', function (e) {
    if (e.keyCode === 13) { // 13 is enter key
      var msg = $(this).val();
      socketio.emit('sendMessage', {
        msg: msg,
        nickname: nickname
      });
      $(this).val('');
    }
  });
  $("#joinRoomForm").on('submit', function (e) {
    e.preventDefault();
    attemptJoinRoom();
  });
  $("#missionNumberInput").change(function () {
    socketio.emit('setMission', $(this).val());
    $("#handNumberInput").val(0);
  });
  $("#handNumberInput").change(function () {
    socketio.emit('setHand', $(this).val());
  });
  $("#missionNumberInput").val(1);
});

function showMessage(msg, nickname) {
  $("#msgBox").append("<span><b>" + nickname + ":</b>&emsp;" + msg + "</span><br><br>");
  scrollToChatBottom();
  $('#boxBottom').show();
}

function setClientPlayerId(playerId) {
  clientPlayerId = playerId;
}

function notifyRoomFull() {
  $("#roomLoader").hide();
  console.log("--------fullRoom-----------");
  alert("Room is Full. Try Again Later");
}

function notifyNameTaken() {
  $("#roomLoader").hide();
  console.log("--------name aken-----------");
  alert("Username taken, try a different one");
}

function notifyUserLeftRoom(nickname) {
  alert(nickname + " left the room. Kicking everybody out... ");
  window.location.reload();
}

function updateMissionNumber(data) {
  $("#missionNumberText").html("<b>Mission #: </b>" + data);
}

function updateAttemptNumber(data) {
  $("#handNumberText").html("<b>Attempt #: </b>" + data);
}

function applyTableCloth(tableCloth) {
  if (tableCloth) {
    $("body").css("background-image", "url('" + tableCloth + "')");
    $("body").css("background-size", "cover");
  } else {
    $("body").css('background-image', '');
    $("body").css("background-size", "20px 20px");
  }
}

function hideTasks() {
  $("#showCase").empty();
  $("#showCase").hide();
}

function updateRoom(room) {
  console.log("UpdateRoom: " + JSON.stringify(room));
  roomJoinedSuccess(room.roomID);
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
  // $.each(roomState.players, function () {
  //   addSeatToTable(counter);
  //   counter = counter + 1;
  // });
  // if (gameConfig_chooseSeats) {
  //   $("#playerSelectLabel").show();
  //   $("#seatingArea").show();
  //   applySeatButtonClickListener();
  // } else {
  $("#playerSelectLabel").hide();
  $("#seatingArea").hide();
  // }

  $.each(roomState.players, function () {
    var nickname = this.nickname;
    if (nickname.length <= 0) {
      nickname = this.id;
    }
    var seatIndex = roomState.seats.indexOf(this.id) + 1;
    if (nickname == client_username) { //TODO: Base on ID instead of nickname
      console.log("All Happening For This Player ("+nickname+")");
      $.cookie("nickname", nickname);
      client_playerNum = seatIndex;
      $("#myName").append(client_playerNum + ": " + nickname);
      playerColor = playerColors[seatIndex - 1];
    }
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
      playerNickNamesBySeatIndex[seatIndex - 1] = nickname;
    }
  });

  $("#playersInRoom").html(standingPlayersHTMLString);
  $("#startGameButton").prop("disabled", !isOkayToStartTheGame(roomState.players.length));
  $("#startGameButton:visible").on("click", function () {
    console.log("startGameButton Clicked");
    if (isOkayToStartTheGame(roomState.players.length)) {
      socketio.emit('startGameOnServer', roomState.gameType);
    } else {
      alert("Problematic Open Seats");
    }
  });
}

function getNicknameForPlayer(player) {
  if (player == -1) {
    return "Anyone";
  }
  var myPIndex = Number(player.slice(-1)) - 1;
  return playerNickNamesBySeatIndex[myPIndex];
}