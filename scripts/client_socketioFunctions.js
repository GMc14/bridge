const lastModifiedString8 = ("Last modified: 2021/01/06 20:48:31");
const socketTS = lastModifiedString8.replace("Last ", "").replace("modified: ", "");
console.log("client_socketioFunction.js " + lastModifiedString8);

//Meta
var socketio = io.connect();

$(function () {
    socketio.on('updateRoom', function (room) {
        console.log("UpdateRoom: "+JSON.stringify(room));
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
        updateMissionNumber();
    });
    socketio.on('setHand', function (data) {
        updateAttemptNumber();
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
});