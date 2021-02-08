const lastModifiedString5 = ("Last modified: 2021/02/08 20:17:11");
const gmTS = lastModifiedString5.replace("Last ", "").replace("modified: ", "");
console.log("client_gameMaster.js " + lastModifiedString5);

var isGameMaster = false;

function updateComms(status) {
  highlightCommunicatable();
}

function makeGameMaster() {
  isGameMaster = true;
}

function getCardID(card) {
  return String(card.suit) + String(card.rank);
}

function getCardFromID(cardID) {
  return {
    suit: cardID.charAt(0),
    rank: cardID.substring(1)
  };
}
$(function () {
  $('#restartGameButton').on('click', function () {
    socketio.emit('restartGame');
  });
  $('#restartGameButton').on('click', function () {
    socketio.emit('revealCards');
  });
  $('#drawTask').on('click', function () {
    $("#taskOptions").hide();
    if (taskDeck.length > 0) {
      taskDeck = getShuffled(taskDeck);
      socketio.emit('taskDrawn', taskDeck.pop());
    } else {
      alert("No Tasks Available");
    }
  });
  $('#chooseTask').on('click', function () {
    console.log("Choose a task card...");
    $("#taskOptions").toggle();
    $("#taskOptions").empty();
    taskDeck = getSorted(taskDeck);
    var previousSuit;
    console.log("taskDeck trumpCards: " + JSON.stringify(taskDeck));
    $.each(taskDeck, function (index, trumpCard) {
      console.log("taskDeck trumpCard: " + JSON.stringify(trumpCard));
      var cardObj = $("#" + getCardID(trumpCard) + "_img").clone().show();
      $(cardObj).attr('task-index', index);
      $(cardObj).addClass('potentialTask');
      if (previousSuit && previousSuit != trumpCard.suit) {
        $("#taskOptions").append("<br/>");
      }
      $("#taskOptions").append(cardObj);
      previousSuit = trumpCard.suit;
    });
    $(".potentialTask").click(function () {
      var selectedCardIndex = $(this).attr("task-index");
      console.log("emitting " + JSON.stringify(taskDeck[selectedCardIndex]) + " base on " + selectedCardIndex);
      socketio.emit('taskDrawn', taskDeck[selectedCardIndex]);
      taskDeck.splice(selectedCardIndex, 1);
      $("#taskOptions").empty();
    });
  });
  $('#hideTasks').on('click', function () {
    $("#taskOptions").empty();
    $(".isTrump").removeClass("isTrump");
    createDeck(true);
    socketio.emit('hideTasks');
  });
  $("#myCommunication").click(function () {
    updateComms(new Date().getTime() % 3);
  });
});