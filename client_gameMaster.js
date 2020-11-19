var isGameMaster = false;

function updateComms(status) {
  if (status == 1) {
    $("#myCommunication").html('mic_none');
  } else if (status == 2) {
    $("#myCommunication").html('mic_off');
  } else {
    $("#myCommunication").html('mic');
  }
}
$(function () {
  socketio.on('makeGameMaster', function () {
    console.log("--------makeGameMaster-----------");
    isGameMaster = true;
  });
  socketio.on('taskDrawn', function (card) {
    console.log("--------------taskDrawn----------------card" + JSON.stringify(card));
    displayTrumpCard(card);
  });
  socketio.on('hideTasks', function () {
    $("#showCase").empty();
    $("#showCase").hide();
  });
  socketio.on('cycleClientOrderIcon', function (data) {
    console.log("--------------cycleClientOrderIcon----------------data.cardID " + data.cardID + ",  data.icon: " + data.icon);
    setTrumpCardOrderIcon(data.cardID, data.icon);
  });
  socketio.on('cycleClientOrderAssignee', function (data) {
    console.log("--------------cycleClientOrderAssignee----------------data.cardID " + data.cardID + ",  data.player: " + data.player);
    setTrumpCardAssignee(data.cardID, data.player);
  });
  socketio.on('assignShortNameToClients', function (data) {
    console.log("--------------assignShortNameToClients----------------data.playerNumber " + data.playerNumber + ",  data.shortName: " + data.shortName);
    setPlayerShortName(data.playerNumber, data.shortName);
  });
  $('#restartGame').on('click', function () {
    console.log("[][][][][][][][][][]Need to ClearTrumpHighlights here?[][][][][][][][][][][]");
    socketio.emit('restartGame');
  });
  $('#drawTask').on('click', function () {
    if (taskDeck.length > 0) {
      taskDeck = getShuffled(taskDeck);
      socketio.emit('taskDrawn', taskDeck.pop());
    } else {
      alert("No Tasks Available");
    }
  });
  $('#chooseTask').on('click', function () {
    taskDeck = getSorted(taskDeck);
    var previousSuit;
    $.each(taskDeck, function (index, trumpCard) {

      var cardRank = String(trumpCard.rank);
      var cardSuit = String(trumpCard.suit);
      var cardID = cardSuit + cardRank;
      var cardObj = $("#" + cardID + "_img").clone().show();
      $(cardObj).attr('task-index', index);
      $(cardObj).addClass('potentialTask');
      if (previousSuit && previousSuit != cardSuit) {
        $("#taskOptions").append("<br/>");
      }
      $("#taskOptions").append(cardObj);
      previousSuit = cardSuit;
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
    createDeck(true);
    socketio.emit('hideTasks');
  });
  $("#myCommunication").click(function () {
    updateComms(new Date().getTime() % 3);
  });
});