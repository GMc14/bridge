var otherColor;
var playerColor;
var currentBidder;
var currentBid;
var passCount;

function listenToBids() {
  console.log("GMcCards-bidFunctions.js-listenToBids-#0000");
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