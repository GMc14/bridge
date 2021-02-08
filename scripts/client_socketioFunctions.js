const lastModifiedString8 = ("Last modified: 2021/02/08 20:24:29");
const socketTS = lastModifiedString8.replace("Last ", "").replace("modified: ", "");
console.log("client_socketioFunction.js " + lastModifiedString8);

//Meta
var socketio = io.connect();

$(function () {
    socketio.on('updateRoom', function (room) {
        updateRoom(room);
    });
    socketio.on('leftInGame', function (nickname) {
        notifyUserLeftRoom(nickname);
    });
    socketio.on('startGame', function (data) {
        initialStartGame(data);
    });
    socketio.on('restartGame', function () {
        startGame();
    });
    socketio.on('revealCards', function () {
        revealCards();
    });
    socketio.on('dealToClients', function (data) {
        deal(data);
    });
    socketio.on('cardPlayed', function (data) {
        cardPlayed(data);
    });
    socketio.on('winnerOfRound', function (data) {
        winnerOfRound(data);
    });
    socketio.on('some1Bid', function (data) {
        someoneBid(data);
    });
    socketio.on('some1Passed', function () {
        someonePassed();
    });
    socketio.on('declareSuit', function (suit) {
        suitDeclared(suit);
    });
    socketio.on('orderUp', function () {
        orderedUp();
    });
    socketio.on('communicateCard', function (data) {
        cardCommunicated(data);
    });
    socketio.on('setMission', function (data) {
        updateMissionNumber(data);
    });
    socketio.on('setHand', function (data) {
        updateAttemptNumber(data);
    });
    socketio.on('cardDrawn', function (data) {
        cardDrawn(data);
    });
    socketio.on('voteSubmitted', function (data) {
        voteSubmitted(data);
    });
    socketio.on('setPlayerId', function (playerId) {
        setClientPlayerId(playerId);
    });
    socketio.on('fullRoom', function () {
        notifyRoomFull();
    });
    socketio.on('nameTaken', function () {
        notifyNameTaken();
    });
    socketio.on('message', function (data) {
        showMessage(data.msg, data.nickname);
    });
    socketio.on('makeGameMaster', function () {
        makeGameMaster();
    });
    socketio.on('taskDrawn', function (card) {
        displayTrumpCard(card);
    });
    socketio.on('hideTasks', function () {
        hideTasks();
    });
    socketio.on('cycleClientOrderIcon', function (data) {
        setTrumpCardOrderIcon(getCardID(data.card), data.icon);
    });
    socketio.on('cycleClientOrderAssignee', function (data) {
        setTrumpCardAssignee(getCardID(data.card), data.player);
    });
    socketio.on('assignShortNameToClients', function (data) {
        setPlayerShortName(data.playerNumber, data.shortName);
    });
});