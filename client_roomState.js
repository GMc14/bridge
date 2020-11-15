function playerModule() {
  console.log("--------------playerModule----------------");
  if (playerModuleIsShowing) {
      return;
  }
  playerModuleIsShowing = true;
  clearSetupModule();
  var playerSetup = document.createElement("div");
  playerSetup.setAttribute("id", "playerSetup");

  var nicknameInput = document.createElement("input");
  nicknameInput.setAttribute("type", "text");
  nicknameInput.setAttribute("id", "nickname");
  var span1 = document.createElement("span");
  span1.setAttribute("id", "nicknameLabel");
  span1.appendChild(document.createTextNode("NICKNAME:"));

  var teamInfo = '';
  if (gameConfig_isBridge || gameConfig_hasTeams) {
      teamInfo = "(TEAMS: 1 & 3 and 2 & 4)"
  }
  var span2 = document.createElement("span");
  span2.setAttribute("id", "playerSelectLabel");
  span2.appendChild(document.createTextNode("SELECT PLAYER: " + teamInfo));
  
  $(playerSetup).append(span2);
  $(playerSetup).append(span1);
  $(playerSetup).append("<br />");
  $(playerSetup).append(nicknameInput);
  $(playerSetup).append("<br />");
  $(playerSetup).append("<br />");

  var previousNickName = $.cookie("nickname");
  if (previousNickName) {
      $(nicknameInput).val(previousNickName);
  }

  for (var j = 1; j <= gameConfig_playerCount; j++) {
      var currPlayer = document.createElement("input");
      currPlayer.setAttribute("type", "button");
      currPlayer.setAttribute("id", "btnPlayer" + j);
      currPlayer.setAttribute("data-player-number", j);
      currPlayer.setAttribute("class", "playerBtns");
      currPlayer.setAttribute("value", "Seat" + j);

      $(playerSetup).append("<br />");
      $(playerSetup).append(currPlayer);
  }
  $(playerSetup).append("<br />");
  if (isGameMaster) {
      $(playerSetup).append('<button id="startGameButton" class="startBtn">Start Game</button>');
      $("#startGameButton").on("click", function () {
          if (isOkayToStartTheGame()) {
              socketio.emit('startGameOnServer');
          } else {
              alert("Problematic Open Seats");
          }
      });
  }
  $(".setupModule:eq(0)").append(playerSetup);
  $(".playerBtns").on("click", function () {
      console.log("--------------playerBtns Click----------------");
      playerNum = $(this).val();
      nickname = String($("#nickname").val());
      playerIndex = Number($(this).attr("data-player-number"));
      console.log("playerSelect >> playerNum: " + playerNum + "  >> nickname: " + nickname + "  >>  playerIndex: " + playerIndex);
      if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
          alert('Pick a unique Nickname!');
      } else {
          // $("#playerSetup").hide();
          // $(".setupModule:eq(0)").html("<div class='loading'>Waiting for Teams</div>");
          

          var boldNames = document.createElement("b");
          boldNames.appendChild(document.createTextNode(playerNum + ': ' + nickname));
          $("#myName").append(boldNames);
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
          $("#nickname").prop('disabled', true);
      }
  });
}