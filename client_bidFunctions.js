var otherColor;
var playerColor;
var currentBidder;
var currentBid;
var passCount;

function updateActionStates() {
  const isMyTurn = playerNum == currentBidder;
  console.log("updateActionStates  " + isMyTurn + "  :" + playerNum + " =? " + currentBidder + "   gameConfig_biddingState:" + gameConfig_biddingState);
  $("#orderUp").toggle(gameConfig_biddingState == BiddingStates.ORDERING_UP && isMyTurn);
  $("#declareSuit").toggle(gameConfig_biddingState == BiddingStates.SUIT_SELECTION && isMyTurn);
  $("#suitSelectionDropdown").toggle(gameConfig_biddingState == BiddingStates.SUIT_SELECTION && isMyTurn);
  $(".bidCell").hide(gameConfig_biddingState == BiddingStates.BETTING);
  $('#pass').toggle(isMyTurn);
}

function startBidding() {
  const isMyTurn = playerNum == currentBidder;
  console.log("GMcCards-bidFunctions.js-startBidding: " + gameConfig_biddingState);
  if (gameConfig_biddingState == BiddingStates.PREBID) {
    if (gameType == GameType.EUCHRE) {
      gameConfig_biddingState = BiddingStates.ORDERING_UP;
    } else if (gameType == GameType.BRIDGE) {
      gameConfig_biddingState = BiddingStates.BETTING;
      $("#bidArea").show();
    } else {
      alert("GameType not configured for bidding: " + gameType);
    }

    console.log("GMcCards-bidFunctions.js-startBidding: init Buttons");
    $('#orderUp').click(function () {
      console.log("GMcCards-bidFunctions.js-orderUp");
      if (confirm('orderUp')) {
        socketio.emit('orderUp');
      }
    });
    $('#declareSuit').click(function () {
      console.log("GMcCards-bidFunctions.js-declareSuit");
      if (confirm('declareSuit')) {
        socketio.emit('declareSuit', $("#suitSelectionDropdown").val());
      }
    });
    $('#pass').click(function () {
      console.log("GMcCards-bidFunctions.js-passClick");
      if (confirm('Pass')) {
        socketio.emit('pass');
      }
    });
    $(".bidCell").click(function (e) {
      console.log("GMcCards-bidFunctions.js-bidCellClick-#0000");
      var id = $(this).attr('id');
      if (e.which) {
        if (isMyTurn) {
          var bid = confirm('Bid: ' + id);
          if (bid) {
            $(this).css('background-color', playerColor);
            socketio.emit('bid', {
              color: playerColor,
              bid: id
            });
            var col = this.cellIndex;
            var row = this.parentNode.rowIndex;
            disablePrevCells(row, col);
          }
        } else {
          alert("Not your turn to bid!");
        }
      } else {
        $(this).css('background-color', otherColor);
        var col = this.cellIndex;
        var row = this.parentNode.rowIndex;
        disablePrevCells(row, col);
      }
    });

  } else if (gameConfig_biddingState == BiddingStates.ORDERING_UP) {
    gameConfig_biddingState = BiddingStates.SUIT_SELECTION;
  } else {
    alert("not prebid?");
  }
  currentBidder = nextPlayer(dealer);
  updateActionStates();

}

function disablePrevCells(row, col) {
  console.log("GMcCards-bidFunctions.js-disablePrevCells-#0000");
  var table = document.getElementById("bidTable");
  var colLength = table.rows[0].cells.length;

  for (var i = 1; i <= col; i++) {
    $('#bidTable tr').eq(row).find('td').eq(i).off("click");
  }
  for (var i = 1; i < row; i++) {
    for (var j = 1; j < colLength; j++) {
      $('#bidTable tr').eq(i).find('td').eq(j).off("click");

    }
  }
}

function someoneBid(data) {
  passCount = 0;
  currentBidder = nextPlayer(currentBidder);
  currentBid = data.bid;
  otherColor = data.color;
  $('#' + data.bid).trigger('click');
  updateActionStates();
}

function someonePassed() {
  console.log("someonePassed");
  passCount++;
  if (gameConfig_biddingState == BiddingStates.BETTING) {
    if (passCount == gameConfig_playerCount) {
      $('#bidOfRound').html('<b>' + currentBidder + ": " + currentBid + '</b>');
      trumpSuit = currentBid.charAt(1);
      if (playerNum == currentBidder || playerNum == nextPlayer(nextPlayer(currentBidder))) {
        handsNeeded = 6 + Number(currentBid.charAt(0));
      } else {
        handsNeeded = 14 - (6 + Number(currentBid.charAt(0)));
      }
      currentPlayer = nextPlayer(currentBidder);
      lead = currentPlayer;
      $('#bidArea').hide();
      if (playerNum == currentPlayer) {
        updateTurnIndicator("You", true, true);
      }

      $('#bidOfRound').show();
      gameConfig_biddingState = BiddingStates.FINISHED;
      return;
    }
  } else if (gameConfig_biddingState == BiddingStates.ORDERING_UP) {
    console.log("someonePassed: ORDERING_UP passCount: "+passCount+" / "+gameConfig_playerCount);
    if (passCount == gameConfig_playerCount) {
      console.log("someonePassed: move to suit selection");
      startBidding();
      return;
    }
  }

  currentBidder = nextPlayer(currentBidder);
  if (playerNum == currentBidder) {
    updateTurnIndicator("You", true, false);
  }
  updateActionStates()
}

function suitDeclared(suit) {
  console.log("suitDeclared: " + suit);
  trumpSuit = suit;
  gameConfig_biddingState = BiddingStates.FINISHED;
}

function orderedUp() {
  console.log("orderedUp");
  gameConfig_biddingState = BiddingStates.FINISHED;
}