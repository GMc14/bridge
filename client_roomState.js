function playerModule() {
  console.log("--------------playerModule----------------");
  if (playerModuleIsShowing) {
    console.log("-------------- Been Hee Before ----------------");
    return;
  }
  playerModuleIsShowing = true;
  clearSetupModule();

  var teamInfo = '';
  if (gameConfig_isBridge || gameConfig_hasTeams) {
    teamInfo = "(TEAMS: 1 & 3 and 2 & 4)"
  }

  $(".setupModule:eq(0)").append("<div id='playerSetup'></div>");
  $("#playerSetup").append($("<span class='seatSelectionLabel' id='nicknameLabel'>NICKNAME:</span>"));
  $("#playerSetup").append($("<input id='nicknameInput' type='text'></input>"));
  $("#playerSetup").append($("<span class='seatSelectionLabel' id='playerSelectLabel'>SELECT SEAT:" + teamInfo + "</span>"));
  var previousNickName = $.cookie("nickname");
  if (previousNickName) {
    $("#nicknameInput").val(previousNickName);
  }

  for (var j = 1; j <= gameConfig_playerCount; j++) {
    addSeatToTable(j);
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

  $(".playerBtns").on("click", function () {
    console.log("--------------playerBtns Click----------------");
    playerNum = $(this).val();
    nickname = String($("#nicknameInput").val());
    playerIndex = Number($(this).attr("data-player-number"));
    console.log("playerSelect >> playerNum: " + playerNum + "  >> nickname: " + nickname + "  >>  playerIndex: " + playerIndex);
    if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
      alert('Pick a unique Nickname!');
    } else {
      $("#myName").append("<b>" + playerNum + ": " + nickname + "</b>");
      $.cookie("nickname", nickname);
      console.log("--------------playerBtns emit playerSeated...----------------");
      socketio.emit('playerSeated', {
        nickname: nickname,
        playerNum: playerNum,
        playerIndex: playerIndex,
        roomID: roomID
      });
      //TODO: show chat if want to use it $('#chat').show();
      playerColor = playerColors[playerIndex - 1];
      $(".playerBtns").prop('disabled', true);
      $("#nicknameInput").prop('disabled', true);
    }
  });
}

function addSeatToTable(seatNumber) {
  console.log("--------------addSeatToTable ----------------: "+seatNumber);
  if ($("#btnPlayer"+seatNumber).length < 1) {
    var seatButton = document.createElement("input");
    seatButton.setAttribute("type", "button");
    seatButton.setAttribute("id", "btnPlayer" + seatNumber);
    seatButton.setAttribute("data-player-number", seatNumber);
    seatButton.setAttribute("class", "playerBtns");
    seatButton.setAttribute("value", "Seat" + seatNumber);
    $("#playerSetup").append(seatButton);
  }
}
