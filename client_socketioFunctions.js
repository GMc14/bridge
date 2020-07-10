var socketio = io.connect();
var roomID;

//Meta
var playerNickNames = ['', '', '', ''];
var playersArray = ["Player1", "Player2", "Player3"];
var playerColors = ['#004499','#770011','#666600','#116600','#440099','#883300','#006666','#660066'];

//Game Config
var gameConfig_playerCount = 3;
var gameConfig_startCardsPerPlayer = 5;
var gameConfig_numberOfRounds = gameConfig_startCardsPerPlayer; //Plya all cards in hand

var gameConfid_isCrew = true;
var crewBonusCards = new Array("R1","R2","R3",'R4');
var gameConfig_permaTrumpSuit = gameConfid_isCrew?"R":'';
var bonusCards = gameConfid_isCrew?crewBonusCards:[];

var gameConfig_isBridge = false;
var gameConfig_bidForTrump = gameConfig_isBridge;
var gameConfig_hasTeams = gameConfig_isBridge;

var gameConfig_isEuchre = false;
var gameConfig_topDeckTrump = gameConfig_isEuchre;
var gameConfig_euchreBowers = gameConfig_isEuchre;

//Deck Setup
var deck = [];
var suits = new Array("C", "D", "H", "S");
var suitColors= {"C":"Black", "S":"Black", "H":"Red", "D":"Red"}

var standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
var euchreRanks = new Array(9, 10, 11, 12, 13, 14);
var crewRanks = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9);

var ranks = standardRanks;
if(isEuchre){
    ranks = euchreRanks;
} else if (isCrew) {
    ranks = crewRanks;
} 
var cardback = "card_imgs/cardback.png";

//Player values
var nickname;
var pLeft;
var playerNum;
var playerIndex;

//Play values
var dealer = "Player1";
var currentPlayer;
var lead;
var leadSuit;
var trumpSuit;
var tricksWon = 0;
var roundNumber = 0;
var handsNeeded;

$(function () {
    $('#restartGame').on('click', function () {
        socketio.emit('restartGame');
    });
    $("#roomForm").on('submit', function (e) {
        e.preventDefault();
        joinRoom();
    });
    $("#boxTop").on("click", function () {
        $('#boxBottom').toggle();
    });
    $('#textArea').bind('keyup', function (e) {
        if (e.keyCode === 13) { // 13 is enter key
            var msg = $(this).val();
            socketio.emit('sendMessage', {
                msg: msg,
                nickname: nickname
            });
            $(this).val('');
        }
    });
    socketio.on('wait4Players', function (numPlayers) {
        if (numPlayers < gameConfig_playerCount) {
            waitRoom(numPlayers);
        } else {
            playerModule();
        }
    });
    socketio.on('fullRoom', function (data) {
        clearSetupModule();
        $(".setupModule:eq(0)").html("Room is Full. Try Again Later");
    })
    socketio.on('playerDataToClient', function (data) {
        var nickname = data.nickname;
        var player = data.player;
        pLeft = data.pLeft;
        if (player == 'Player1') {
            $("#Player1").remove();
            $("#myPlayer").append($("<p></p>").text(nickname));
            playerNickNames[0] = nickname;
        } else if (player == 'Player2') {
            $("#Player2").remove();
            $("#PosLeft").append($("<p></p>").text(nickname));
            playerNickNames[1] = nickname;
        } else if (player == 'Player3') {
            $("#Player3").remove();
            $("#PlayerAcross").append($("<p></p>").text(nickname));
            playerNickNames[2] = nickname;
        } else {
            $("#Player4").remove();
            $("#PlayerRight").append($("<p></p>").text(nickname));
            playerNickNames[3] = nickname;
        }
    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function () {
        $("#playArea").show();
  
        switch (playerNum) {
            case 'Player1':
                $('#leftName').html('Player2: ' + playerNickNames[1]);
                $('#acrossName').html('Player 3: ' + playerNickNames[2]);
                $('#rightName').html('Player 4: ' + playerNickNames[3]);
                break;
            case 'Player2':
                $('#leftName').html('Player 3: ' + playerNickNames[2]);
                $('#acrossName').html('Player 4: ' + playerNickNames[3]);
                $('#rightName').html('Player 1: ' + playerNickNames[0]);
                break;
            case 'Player3':
                $('#leftName').html('Player 4: ' + playerNickNames[3]);
                $('#acrossName').html('Player 1: ' + playerNickNames[0]);
                $('#rightName').html('Player 2: ' + playerNickNames[1]);
                break;
            case 'Player4':
                $('#leftName').html('Player 1: ' + playerNickNames[0]);
                $('#acrossName').html('Player 2: ' + playerNickNames[1]);
                $('#rightName').html('Player 3: ' + playerNickNames[2]);
                break;
        }

/*
        var clientNumber = parseInt(playerNum.slice(-1));
        $('#leftName').html('Player'+(clientNumber%4)+1+': ' + playerNickNames[clientNumber]);
        $('#acrossName').html('Player '+((clientNumber+1)%4)+1+': ' + playerNickNames[(clientNumber+1)%4]);
        $('#rightName').html('Player '+((clientNumber+2)%4)+1+': ' + playerNickNames[(clientNumber+2)%4]);
*/
        startGame();
    });
    socketio.on('restartGame', function () {
        $('#gameRecap').hide();
        $('.stuff').empty();
        $('.plays').empty();
        $('#bidOfRound').hide();
        $('td').css('background-color', 'transparent');

        startGame();
    });
    socketio.on('some1Bid', function (data) {
        passCount = 0;
        currentBidder = nextPlayer(currentBidder);
        currentBid = data.bid;
        otherColor = data.color;
        $('#' + data.bid).trigger('click');
        if (playerNum == currentBidder) {
            alert("Your Turn to Bid");
        }
    });
    socketio.on('some1Passed', function () {
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
                alert("You lead");
            }
            $('#bidOfRound').show();
        } else {
            currentBidder = nextPlayer(currentBidder);
            if (playerNum == currentBidder) {
                alert("Your Turn to Bid");
            }
        }
    });
    socketio.on('deal', function (data) {
        switch (playerNum) {
            case 'Player1':
                //lightblue
                Player1 = data.hands[0];
                Player2 = data.hands[1];
                Player3 = data.hands[2];
                Player4 = data.hands[3];
                break;
            case 'Player2':
                //light orange
                Player1 = data.hands[1];
                Player2 = data.hands[2];
                Player3 = data.hands[3];
                Player4 = data.hands[0];
                break;
            case 'Player3':
                //darkblue
                Player1 = data.hands[2];
                Player2 = data.hands[3];
                Player3 = data.hands[0];
                Player4 = data.hands[1];
                break;
            case 'Player4':
                // beige
                Player1 = data.hands[3];
                Player2 = data.hands[0];
                Player3 = data.hands[1];
                Player4 = data.hands[2];
                break;
        }
        sortHand();
        displayCards();
        $(".setupModule").hide();
        if (gameConfig_bidForTrump) {
            currentBidder = nextPlayer(dealer);
            listenToBids();
            $("#bidArea").show();
            if (playerNum == currentBidder) {
                alert("Your Turn to Bid");
            }
        } else {
            if(data.trumpCard){
                console.log("------- Trump Card: "+data.trumpCard);
                displayTrumpCard(data.trumpCard)
                trumpSuit = data.trumpCard.suit;
            }  else {
                trumpSuit = gameConfig_permaTrumpSuit;
            }

            handsNeeded = 3;
            currentPlayer = nextPlayer(dealer);
            lead = currentPlayer;
            if (playerNum == currentPlayer) {
                alert("You lead");
            }
            $('#bidOfRound').show();
        }
    });
    socketio.on('cardPlayed', function (data) {
        var player = data.player;
        var card = data.card;

        if (playerNum != lead && player == lead) {
            console.log("ssocketFunctions -> cardPLayed EMPTY"+playerNum+"  :  "+player+"  |  "+lead);
            $(".plays").empty();
        } else {
            console.log("ssocketFunctions -> cardPLayed "+playerNum+"  :  "+player+"  |  "+lead);
        }
        switch (true) {
            case (nextPlayer(playerNum)==player):
                othersPlayed("leftPlay", card);
                break;
            case (gameConfig_playerCount == 4 && nextPlayer(nextPlayer(playerNum))==player):
                othersPlayed("acrossPlay", card);
                break;
            case (prevPlayer(playerNum)==player):
                othersPlayed("rightPlay", card);
                break;
            default:
                console.log("ssocketFunctions -> cardPLayed switch {}"+player+"  :n  "+nextPlayer(playerNum)+"  |p  "+prevPlayer(playerNum));
                break;
        }
        if (currentPlayer == lead) {
            leadSuit = card.charAt(0);
            if(gameConfig_euchreBowers && card.substr(1) == "11" && suitColors[leadSuit] == suitColors[trumpSuit]){
                leadSuit = trumpSuit;
            } 
        }
        if (nextPlayer(currentPlayer) == lead) {
            resolveTrick();
        }

        currentPlayer = nextPlayer(currentPlayer);
    });
    socketio.on('winnerOfRound', function (trickWinner, trickCards) {   
        console.log("socketFunctions:->winnerOfRound");
        roundNumber++;
        lead = trickWinner;
        currentPlayer = trickWinner;
        switch (true) {
            //Player1
            case (trickWinner == nextPlayer(playerNum)):
                addWin("leftStuff", trickCards);
                break;
            case (gameConfig_playerCount == 4 && trickWinner == nextPlayer(nextPlayer(playerNum))):
                addWin("acrossStuff", trickCards);
                tricksWon++;
                break;
            case (trickWinner == prevPlayer(playerNum)):
                addWin("rightStuff", trickCards);
                break;
            default:
                break;
        }
        if (roundNumber == gameConfig_numberOfRounds) {
            calculateWinner();
        }
    });
    socketio.on('message', function (data) {
        var msg = data.msg;
        var nickname = data.nickname;
        var chatBox = $("#chatBox");
        var textBox = $("#msgBox");
        textBox.append("<span><b>" + nickname + ":</b>&emsp;" + msg + "</span><br><br>");
        scrollToBottom();
        $('#boxBottom').show();
    });
});

function nextPlayer(currPlayer) {
    var i = playersArray.indexOf(currPlayer);
    return playersArray[i == playersArray.length - 1 ? 0 : i + 1];
}

function prevPlayer(currPlayer) {
    var i = playersArray.indexOf(currPlayer);
    return playersArray[i == 0 ? playersArray.length - 1 : i - 1];
}

function clearSetupModule() {
    var setupModule = document.getElementsByClassName("setupModule")[0];
    while (setupModule.firstChild) {
        setupModule.removeChild(setupModule.firstChild);
    }
}

function joinRoom() {
    roomID = $("#roomID").val();
    pLeft = gameConfig_playerCount;
    if (roomID == '') {
        alert('RoomID must be 1-4 characters long');
    } else {
        socketio.emit('create', roomID);
        clearSetupModule();
        var roomText = document.createElement("span");
        roomText.setAttribute("id", "roomText");
        roomText.appendChild(document.createTextNode("Room Code: " + roomID));
        $("#topbar").prepend(roomText);
        $("#leaveRoom").show();
    }
}

function leaveRoom() {
    socketio.emit('leave', roomID);
    $("#leaveRoom").hide();
    // $("#roomText").remove();
    // clearSetupModule();
    // roomModule();
    window.location.reload();
}

function waitRoom(num) {
    clearSetupModule();
    $(".setupModule:eq(0)").html("<div class='loading'>Current Players in Room: " + num + " <br> Waiting for Players</div>");
}

function playerModule() {
    clearSetupModule();
    var playerSetup = document.createElement("div");
    playerSetup.setAttribute("id", "playerSetup");

    var nickname = document.createElement("input");
    nickname.setAttribute("type", "text");
    nickname.setAttribute("id", "nickname");
    var span1 = document.createElement("span");
    span1.appendChild(document.createTextNode("NICKNAME:"));

    var teamInfo='';
    if(gameConfig_isBridge|| gameConfig_hasTeams){
        teamInfo = "(TEAMS: 1 & 3 and 2 & 4)"
    }
    var span2 = document.createElement("span");
    span2.appendChild(document.createTextNode("SELECT PLAYER: "+teamInfo));
    playerSetup.appendChild(span2);
    
    playerSetup.appendChild(span1);
    playerSetup.appendChild(document.createElement("br"));
    playerSetup.appendChild(nickname);
    playerSetup.appendChild(document.createElement("br"));
    playerSetup.appendChild(document.createElement("br"));

    for (var j = 1; j <= gameConfig_playerCount; j++) {
        var currPlayer = document.createElement("input");
        currPlayer.setAttribute("type", "button");
        currPlayer.setAttribute("id", "btnPlayer"+j);
        currPlayer.setAttribute("data-player-number", j);
        currPlayer.setAttribute("class", "playerBtns");
        currPlayer.setAttribute("value", "Player "+j);

        playerSetup.appendChild(document.createElement("br"));
        playerSetup.appendChild(currPlayer);
    }
    $(".setupModule:eq(0)").append(playerSetup);
    playerSelect();
}

function playerSelect() {
    $(".playerBtns").on("click", function () {
        playerNum = $(this).attr('id');
        nickname = String($("#nickname").val());
        playerIndex = Number($(this).attr("data-player-number"));
        if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
            alert('Pick a unique Nickname!');
        } else {
            $("#playerSetup").hide();
            $(".setupModule:eq(0)").html("<div class='loading'>Waiting for Teams</div>");
            var boldNames = document.createElement("b");
            boldNames.appendChild(document.createTextNode(playerNum + ': ' + nickname));
            $('#topbar').append('<br/>');
            $("#topbar").append(boldNames);
            pLeft--;
            socketio.emit('selPlayer', {
                nickname: nickname,
                playerNum: playerNum,
                roomID: roomID,
                pLeft: pLeft
            });
            $('#chat').show();
            playerColor = playerColors[playerIndex];
            
        }
    });
}

function addWin(who, cards) {

    console.log("addWin "+$(".plays").length+"plays:   "+JSON.stringify($(".plays")));
    var stuff = $('#' + who);
    var card = document.createElement("div");
    card.setAttribute('class', 'otherCards');
    card.setAttribute('data-cards', cards);
    $(".cardback:eq(0)").clone().show().appendTo(card);
    stuff.append(card);
}

function calculateWinner() {
    var win = tricksWon < handsNeeded ? 0 : 1;
    if (win) {
        $('#winners').html('<b>WINNER:</b> YOU');
    } else {
        $('#winners').html('<b>WINNER:</b> NOT YOU');
    }
    $('#gameBid').html('<b>BID:</b> ' + currentBid + ' (' + currentBidder + ')');
    $('#wins').html('<b>YOU WON:</b> ' + tricksWon + ' tricks');
    refreshTeamWins(win);
    dealer = nextPlayer(dealer);
    currentPlayer = '', lead = '', leadSuit = '', trumpSuit = '', handsNeeded = '', tricksWon = 0, roundNumber = 0;
    $('#gameRecap').show();
}

function refreshTeamWins(win) {
    switch (win) {
        case 0:
            var numWins = $('#leftWin').html();
            numWins = Number(numWins) + 1;
            $('#leftWin').html(numWins);
            $('#rightWin').html(numWins);
            break;
        case 1:
            var numWins = $('#acrossWin').html();
            numWins = Number(numWins) + 1;
            $('#myWin').html('Team Wins: ' + numWins);
            $('#acrossWin').html(numWins);
            break;
    }
}

function scrollToBottom() {
    var divObj = $("#msgBox");
    divObj.scrollTop($(divObj)[0].scrollHeight);
}