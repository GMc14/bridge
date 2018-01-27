var dealer = "Player1";
var currentPlayer;
var nextPlayer = {"Player1":"Player2", "Player2":"Player3", "Player3":"Player4", "Player4":"Player1"};
var prevPlayer = {"Player1":"Player4", "Player2":"Player1", "Player3":"Player2", "Player4":"Player3"};
var lead;
var leadSuit;
var trumpSuit;
var handsNeeded;
var roundWins=0;

function checkLegal(cardID) {
  if (cardID.charAt(0) == leadSuit) {
    return true;
  }
  else {
    for (var i=0; i<Player1.length; i++) {
      if (String(Player1[i].suit) == leadSuit) {
        alert("Must Follow Suit!");
        return false;
      }
    }
    return true;
  }
}

function winRound() {
  var myCard = $("#myPlay");
  var rightCard = $("#rightPlay");
  var acrossCard = $("#acrossPlay");
  var leftCard = $("#leftPlay");

  if (compareCard(myCard,rightCard) && compareCard(myCard, acrossCard) && compareCard(myCard, leftCard)) {
    addWin("myStuff");
    roundWins++;
    socketio.emit('winner',{player:playerNum, roomID: roomID});
  }

  function compareCard(card1, card2) {
      var card1ID = card1.find("img").attr("id").slice(0,-4);
      var card2ID = card2.find("img").attr("id").slice(0,-4);
      var win = 1;
      if (card1ID.charAt(0)==card2ID.charAt(0)) {
        win = (Number(card1ID.substr(1))>Number(card2ID.substr(1))) ? 1 : 0;
      }
      else if (card1ID.charAt(0)!=trumpSuit && card2ID.charAt(0)==trumpSuit) {
        win = 0;
      }
      else if ((card1ID.charAt(0)!=trumpSuit && card1ID.charAt(0)!=leadSuit) && card2ID.charAt(0)==leadSuit) {
        win = 0;
      }
      return win;
  }
}
