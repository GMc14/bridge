var dealer = "Player1";
var currentPlayer;
var lead;
var leadSuit;
var trumpSuit;
var handsNeeded;
var roundWins = 0;

function checkLegal(cardID) {

  console.log("GMcCards-rules.js-checkLegal-#0000");
  if (cardID.charAt(0) == leadSuit) {
    console.log("GMcCards-rules.js-checkLegal-#0300");
    return true;
  } else {
    for (var i = 0; i < Player1.length; i++) {
      if (String(Player1[i].suit) == leadSuit) {
        alert("Must Follow Suit!");

        console.log("GMcCards-rules.js-checkLegal-#0600");
        return false;
      }
    }

    console.log("GMcCards-rules.js-checkLegal-#1000");
    return true;
  }

}

function winRound() {
  console.log("GMcCards-rules.js-winRound-#0000");
  var myCard = $("#myPlay");

  var isWinner = true;

  $(".plays").each(function(){
    if(!compareCard(myCard, $(this))){
      isWinner=false;
    }
  });

  if (isWinner) {
    console.log("GMcCards-rules.js-winRound-#0300");
    addWin("myStuff");
    roundWins++;
    socketio.emit('winner', {
      player: playerNum,
      roomID: roomID
    });
  }

  function compareCard(card1, card2) {
    console.log("GMcCards-rules.js-compareCard-#0000");
    if(!card1.find("img").attr("id")){
      return false;
    }
    if(!card2.find("img").attr("id")){
      return true;
    }
    console.log("GMcCards-rules.js-compareCard-#0500"+ JSON.stringify(card1)+ " vs. "+ JSON.stringify(card2));
    var card1ID = card1.find("img").attr("id").slice(0, -4);
    var card2ID = card2.find("img").attr("id").slice(0, -4);
    var win = 1;
    if (card1ID.charAt(0) == card2ID.charAt(0)) {
      win = (Number(card1ID.substr(1)) > Number(card2ID.substr(1))) ? 1 : 0;
    } else if (card1ID.charAt(0) != trumpSuit && card2ID.charAt(0) == trumpSuit) {
      win = 0;
    } else if ((card1ID.charAt(0) != trumpSuit && card1ID.charAt(0) != leadSuit) && card2ID.charAt(0) == leadSuit) {
      win = 0;
    }
    return win;
  }

  console.log("GMcCards-rules.js-winRound-#1000");
}