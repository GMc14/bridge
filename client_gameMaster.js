var isGameMaster = false;

function updateComms(status) {
  highlightCommunicatable();
}
function getCardID(card){
  return String(card.suit) + String(card.rank);
}
function getCardFromID(cardID){
  return {suit:cardID.charAt(0), rank:cardID.substring(1)};
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
    console.log("--------------cycleClientOrderIcon----------------data.card " + JSON.stringify(data.card) + ",  data.icon: " + data.icon);
    setTrumpCardOrderIcon(getCardID(data.card), data.icon);
  });
  socketio.on('cycleClientOrderAssignee', function (data) {
    console.log("--------------cycleClientOrderAssignee----------------data.card " + JSON.stringify(data.card) + ",  data.player: " + data.player);
    setTrumpCardAssignee(getCardID(data.card), data.player);
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
    $("#taskOptions").empty();
    taskDeck = getSorted(taskDeck);
    var previousSuit;
    $.each(taskDeck, function (index, trumpCard) {
      var cardObj = $("#" + getCardID(trumpCard.card) + "_img").clone().show();
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
    $("#taskOptions").empty();
    createDeck(true);
    socketio.emit('hideTasks');
  });
  $("#myCommunication").click(function () {
    updateComms(new Date().getTime() % 3);
  });
});