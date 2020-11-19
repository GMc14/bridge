function constructPlayArea() {
  var clientNumber = Number(playerNum.slice(-1));
  for (var j = 1; j < gameConfig_playerCount; j++) {
      var pNumber = Number((clientNumber + j - 1) % gameConfig_playerCount) + 1;

      var stuff = $('<div alt="loc' + j + 'stuff" id="loc' + j + 'stuff" class="stuff"></div>');
      var plays = $('<div alt="loc' + j + 'play" id="loc' + j + 'play" class="plays"></div>');
      var name = $('<div alt="loc' + j + 'name" id="loc' + j + 'name" class="name"></div>');
      var winCounter = $('<div alt="loc' + j + 'wins" id="loc' + j + 'wins" class="winCount">0</div>');
      var playerHand = $('<div alt="loc' + j + 'Hand" class="otherPlayerHand" id="loc' + j + 'Hand" ></div>');
      var playerContainer = $("<div alt='loc" + j + "Container' id='loc" + j + "Container' class='locationContainer'></div>");

      $(playerContainer).append(playerHand);
      $(playerContainer).append(stuff);
      $(playerContainer).append(plays);
      $(playerContainer).append("<select class='trumpDrops plyrDrop plyrDropName' pNum='" + pNumber + "' id='drpPlyrName" + j + "' name='dropdownIcon' size=1>");
      $(playerContainer).append(name);
      $(playerContainer).append(winCounter);

      $("#gameBoard").append(playerContainer);

      var positionRelativeToCenter = j - ((gameConfig_playerCount) / 2);
      $(playerContainer).css({
          "left": ((j - 1) * 90 / (gameConfig_playerCount - 1) + 15.5) + "vw",
          "top": "12vh",
          "transform": "rotate(" + positionRelativeToCenter * 15 + "deg) translateY(" + Math.abs(positionRelativeToCenter) * 4 + "vmax)"
      });
      playerIdMap[j] = 'Player' + pNumber;
      inversePlayerIdMap['Player' + pNumber] = j;
      $("#loc" + j + "name").html('Player' + pNumber + ': ' + playerNickNames[pNumber - 1]);
      $.each(playerOptions, function () {
          $("#drpPlyrName" + j).append('<option value="' + this + '">' + this + '</option>');
      });
      $("#drpPlyrName" + j).change(function () {
          var shortName = $(this).val();
          var tempPNumber = $(this).attr("pNum");
          console.log(">>>>>>>>>>>>>drpPlyrName selected ---------------- cardID:" + tempPNumber + " : " + shortName);
          socketio.emit('assignShortName', {
              playerNumber: tempPNumber,
              roomID: roomID,
              shortName: shortName
          });
      });
  }
  $.each(playerOptions, function () {
      $("#myDrpPlyrName").append('<option value="' + this + '">' + this + '</option>');
  });
  $("#myDrpPlyrName").change(function () {
      var playerNumber = playerNum.replace('Player', '');
      var shortName = $(this).val();
      console.log(">>>>>>>>>>>>>myDrpPlyrName selected ---------------- cardID:" + playerNumber + " : " + shortName);
      socketio.emit('assignShortName', {
          playerNumber: playerNumber,
          roomID: roomID,
          shortName: shortName
      });
  });
}

function calculateGameWinner() {
  var win = tricksWon < handsNeeded ? 0 : 1;
  if (win) {
      $('#winners').html('<b>WINNER:</b> YOU');
  } else {
      $('#winners').html('<b>WINNER:</b> NOT YOU');
  }
  $('#gameBid').html('<b>BID:</b> ' + currentBid + ' (' + currentBidder + ')');
  $('#wins').html('<b>YOU WON:</b> ' + tricksWon + ' tricks');
  refreshTeamWins(win);
  dealer = nextPlayer(dealer);
  currentPlayer = '', lead = '', leadSuit = '', trumpSuit = '', handsNeeded = '', tricksWon = 0, roundNumber = 0;
  $('#gameRecap').show();
}

function refreshTeamWins(win) {
  console.log("refreshTeamWins rewrite this with locations instead of 'left/right/across'");
  switch (win) {
      case 0:
          // var numWins = $('#leftWin').html();
          // numWins = Number(numWins) + 1;
          // $('#leftWin').html(numWins);
          // $('#rightWin').html(numWins);
          break;
      case 1:
          // var numWins = $('#acrossWin').html();
          // numWins = Number(numWins) + 1;
          // $('#myWin').html(numWins);
          break;
  }
}