var otherColor;
var playerColor;
var currentBidder;
var currentBid;
var passCount;

function startBidding() {
  currentBidder = nextPlayer(dealer);
  $("#bidArea").show();
  if (playerNum == currentBidder) {
    alert("Your Turn to Bid");
  }
  console.log("GMcCards-bidFunctions.js-startBidding-#0000");
  $('#pass').click(function () {
    console.log("GMcCards-bidFunctions.js-passClick-#0000");
    if (playerNum == currentBidder) {
      var pass = confirm('Pass');
      if (pass) {
        socketio.emit('pass');
      }
    } else {
      alert("Not your turn to bid!");
    }
  });
  $(".bidCell").click(function (e) {
    console.log("GMcCards-bidFunctions.js-bidCellClick-#0000");
    var id = $(this).attr('id');
    if (e.which) {
      if (playerNum == currentBidder) {
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
  if (playerNum == currentBidder) {
    alert("Your Turn to Bid");
  }
}
function someonePassed() {
  passCount++;
  if (passCount == 4) {
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
  } else {
    currentBidder = nextPlayer(currentBidder);
    if (playerNum == currentBidder) {
      alert("Your Turn to Bid");
    }
  }
}
