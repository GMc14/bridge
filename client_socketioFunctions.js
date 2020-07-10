var socketio = io.connect();
var roomID;

//Meta
var playerNickNames = ['', '', '', '','', '', '', ''];
var playersArray = ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6", "Player7" ,"Player8"];
var playerColors = ['#004499','#770011','#666600','#116600','#440099','#883300','#006666','#660066'];
var positions = ["#myHand","#loc1Hand","#loc2Hand","#loc3Hand"];

//Game Config
var gameConfig_playerCount = 3;
var gameConfig_startCardsPerPlayer = 5;
var gameConfig_numberOfRounds = gameConfig_startCardsPerPlayer; //Plya all cards in hand

var gameConfid_isCrew = true;
var gameConfig_permaTrumpSuit = gameConfid_isCrew?"R":'';
var crewBonusCards = new Array("R1","R2","R3",'R4');
var bonusCards = gameConfid_isCrew?crewBonusCards:[];
var crewMissions=[
    "1T", //1 Task
    "2T",
    "2T,2O", //2 Ordered Tasks
    "3T",
    "1Z", //One player receives no tricks (Captain decides)
    "3T2O,?C"
]
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
if(gameConfig_isEuchre){
    ranks = euchreRanks;
} else if (gameConfid_isCrew) {
    ranks = crewRanks;
} 
var cardback = "card_imgs/cardback.png";

//Player values
var nickname;
var remainingPlayers;
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
        var playerIndex = data.playerIndex;
        remainingPlayers = data.remainingPlayers;
        
        console.log("playerDataToClient---- >> playerIndex: "+playerIndex+"  >> nickname: "+nickname+"  >>  remainingPlayers: "+remainingPlayers);
        $("#btnPlayer"+playerIndex).remove();
        playerNickNames[playerIndex-1] = nickname;
        $(positions[playerIndex-1]).append($("<p></p>").text(nickname));

    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function () {
        $("#playArea").show();
        console.log("client_socket :: startGame");
        constructPlayArea();
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
        
    console.log("--------------deal----------------");
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
        console.log("socketFunctions -> cardPayed card: "+card+"  >>  player: "+player+"  >> nextPlayer: "+nextPlayer(playerNum)+"  >>  prevPlayer: "+prevPlayer(playerNum));
        if (playerNum != lead && player == lead) {
            console.log("ssocketFunctions -> cardPLayed EMPTY"+playerNum+"  :  "+player+"  |  "+lead);
            $(".plays").empty();
        } else {
            console.log("ssocketFunctions -> cardPLayed "+playerNum+"  :  "+player+"  |  "+lead);
        }

        othersPlayed(player, card);
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
        addWin("loc"+trickWinner+"Stuff", trickCards);
        if (gameConfig_isBridge && gameConfig_playerCount == 4 && trickWinner == nextPlayer(nextPlayer(playerNum))){
            tricksWon++;
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
    console.log("--------------clearSetupModule----------------");
    var setupModule = document.getElementsByClassName("setupModule")[0];
    while (setupModule.firstChild) {
        setupModule.removeChild(setupModule.firstChild);
    }
}

function joinRoom() {
    roomID = $("#roomID").val();
    remainingPlayers = gameConfig_playerCount;
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
    console.log("--------------playerModule----------------");
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
        currPlayer.setAttribute("value", "Player"+j);

        playerSetup.appendChild(document.createElement("br"));
        playerSetup.appendChild(currPlayer);
    }
    $(".setupModule:eq(0)").append(playerSetup);
    playerSelect();
}

function playerSelect() {
    $(".playerBtns").on("click", function () {
        console.log("--------------playerBtns Click----------------");
        playerNum = $(this).val();
        nickname = String($("#nickname").val());
        playerIndex = Number($(this).attr("data-player-number"));
        console.log("playerSelect >> playerNum: "+playerNum+"  >> nickname: "+nickname+"  >>  playerIndex: "+playerIndex);
        if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
            alert('Pick a unique Nickname!');
        } else {
            $("#playerSetup").hide();
            $(".setupModule:eq(0)").html("<div class='loading'>Waiting for Teams</div>");
            var boldNames = document.createElement("b");
            boldNames.appendChild(document.createTextNode(playerNum + ': ' + nickname));
            $('#topbar').append('<br/>');
            $("#topbar").append(boldNames);
            remainingPlayers--;
            
            console.log("--------------playerBtns emit selPlayer...----------------");
            socketio.emit('selPlayer', {
                nickname: nickname,
                playerNum: playerNum,
                playerIndex: playerIndex,
                roomID: roomID,
                remainingPlayers: remainingPlayers
            });
            $('#chat').show();
            playerColor = playerColors[playerIndex-1];
            
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
    console.log("refreshTeamWins rewrite this with locations instead of 'left/right/across'");
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

function constructPlayArea() {
    var clientNumber = Number(playerNum.slice(-1));
    for (var j = 1; j <= gameConfig_playerCount; j++) {
        var stuff = $('<div id="loc'+j+'stuff" class="stuff"></div>');
        var plays = $('<div id="loc'+j+'play" class="plays"></div>');
        var name = $('<div id="loc'+j+'name" class="name"></div>');
        var winCounter = $('<div id="loc'+j+'wins" class="winCount">0</div>');

        var playerContainer = $("<div id='loc"+j+"Container' class='locationContainer'></div>");
        $(playerContainer).append(stuff);
        $(playerContainer).append(plays);
        $(playerContainer).append(name);
        $(playerContainer).append(winCounter);

        $("#playArea").append(playerContainer);
        
        //FIXME: use this once player locations are functioning --> rotate($("#loc"+j+"Container"), j * 360 / gameConfig_playerCount);
        var playerHand = '<div class="otherPlayerHand" id="loc'+j+'hand" ></div>';
        $("#gameBoard").append(playerHand);

        var positionRelativeToCenter = 1 + j - ((gameConfig_playerCount+1)/2);
        $("#loc"+j+"hand").css({ 
            "left": (j*100/gameConfig_playerCount)+"vw", 
            "top": "5vh", 
            "transform": "rotate("+positionRelativeToCenter*4+"deg) translateY("+Math.abs(positionRelativeToCenter)*7+"px)" 
        });

        $("#loc"+j+"name").html('Player'+(clientNumber%gameConfig_playerCount)+(j+1)+': ' + playerNickNames[(clientNumber+j)%gameConfig_playerCount]);
    }
}

function rotate($el, degrees) {
    $el.css({
  '-webkit-transform' : 'rotate('+degrees+'deg)',
     '-moz-transform' : 'rotate('+degrees+'deg)',  
      '-ms-transform' : 'rotate('+degrees+'deg)',  
       '-o-transform' : 'rotate('+degrees+'deg)',  
          'transform' : 'rotate('+degrees+'deg)',  
               'zoom' : 1

    });
}