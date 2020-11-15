function initPlayerModule() {
  console.log("--------------initPlayerModule----------------");
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
function applySeatButtonClickListener(){
  $(".playerBtns").on("click", function () {
    console.log("--------------playerBtns Click----------------");
    playerNum = $(this).val();
    nickname = String($("#nicknameInput").val());
    seatIndex = Number($(this).attr("data-player-number"));
    console.log("playerSelect >> playerNum: " + playerNum + "  >> nickname: " + nickname + "  >>  seatIndex: " + seatIndex);
    if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
      alert('Pick a unique Nickname!');
    } else {
      $("#myName").append("<b>" + playerNum + ": " + nickname + "</b>");
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
  if(seatNumber < 0){
    console.log("--------------addSeatToTable ----------------: invalid seat: "+seatNumber);
    return;
  }
  console.log("--------------addSeatToTable ----------------: "+seatNumber);
  if ($("#btnPlayer"+seatNumber).length < 1) {
    var seatButton = document.createElement("input");
    seatButton.setAttribute("type", "button");
    seatButton.setAttribute("id", "btnPlayer" + seatNumber);
    seatButton.setAttribute("data-player-number", seatNumber);
    seatButton.setAttribute("class", "playerBtns");
    seatButton.setAttribute("value", "Player" + seatNumber);
    $("#seatingArea").append(seatButton);
  }
}
