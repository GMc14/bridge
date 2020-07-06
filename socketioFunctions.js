var socketio = io.connect();
var roomID;
var nickname;
var pLeft;
var playerNum;
var numRounds=0;
var player1NN, player2NN, player3NN, player4NN;



$(function() {
  $('#restartGame').on('click',function() {
    socketio.emit('restartGame');
  });
  $("#roomForm").on('submit', function(e){
    e.preventDefault();
    joinRoom();
  });
  $("#boxTop").on("click", function() {
    $('#boxBottom').toggle();
  });
  $('#textArea').bind('keyup', function(e) {
    if ( e.keyCode === 13 ) { // 13 is enter key
        var msg = $(this).val();
        socketio.emit('sendMessage',{msg:msg, nickname:nickname});
        $(this).val('');
      }
  });
  socketio.on('wait4Players', function(numPlayers) {
    if (numPlayers<3) {
      waitRoom(numPlayers);
    }
    else {
      playerModule();
    }
  });
  socketio.on('fullRoom', function(data) {
    clearSetupModule();
    $(".setupModule:eq(0)").html("Room is Full. Try Again Later");
  })
  socketio.on('playerDataToClient', function(data) {
    var nickname = data.nickname;
    var player = data.player;
    pLeft=data.pLeft;
    if (player=='Player1') {
      $("#Player1").remove();
      $("#myPlayer").append($("<p></p>").text(nickname));
      player1NN = nickname;
    }
    else if (player=='Player2') {
      $("#Player2").remove();
      $("#PlayerLeft").append($("<p></p>").text(nickname));
      player2NN = nickname;
    }
    else if (player=='Player3') {
      $("#Player3").remove();
      $("#PlayerAcross").append($("<p></p>").text(nickname));
      player3NN = nickname;
    }
    else {
      $("#Player4").remove();
      $("#PlayerRight").append($("<p></p>").text(nickname));
      player4NN = nickname;
    }
  });
  socketio.on('leftInGame', function(nickname) {
    alert(nickname+ " left the room. Kicking everybody out... ");
    window.location.reload();
  });
  socketio.on('startGame', function() {
    $("#playArea").show();
    switch(playerNum) {
        case 'Player1':
            $('#leftName').html('Player2: '+ player2NN);
            $('#acrossName').html('Player 3: '+ player3NN);
            $('#rightName').html('Player 4: '+player4NN);
            break;
        case 'Player2':
            $('#leftName').html('Player 3: ' + player3NN);
            $('#acrossName').html('Player 4: ' +player4NN);
            $('#rightName').html('Player 1: ' +player1NN);
            break;
        case 'Player3':
            $('#leftName').html('Player 4: ' +player4NN);
            $('#acrossName').html('Player 1: ' +player1NN);
            $('#rightName').html('Player 2: ' +player2NN);
            break;
        case 'Player4':
            $('#leftName').html('Player 1: ' +player1NN);
            $('#acrossName').html('Player 2: ' +player2NN);
            $('#rightName').html('Player 3: ' +player3NN);
            break;
    }
    startGame();
  });
  socketio.on('restartGame', function() {
    $('#gameRecap').hide();
    $('.stuff').empty();
    $('.plays').empty();
    $('#bidOfRound').hide();
    $('td').css('background-color','transparent');

    startGame();
  });
  socketio.on('deal', function(data) {
    var Hand1 = data.Hand1; var Hand2 = data.Hand2;
    var Hand3 = data.Hand3; var Hand4 = data.Hand4;

    switch(playerNum) {
        case 'Player1':
        //lightblue
            Player1 = Hand1; Player2 = Hand2; Player3 = Hand3; Player4 = Hand4;
            break;
        case 'Player2':
        //light orange
            Player1 = Hand2; Player2 = Hand3; Player3 = Hand4; Player4 = Hand1;
            break;
        case 'Player3':
        //darkblue
            Player1 = Hand3; Player2 = Hand4; Player3 = Hand1; Player4 = Hand2;
            break;
        case 'Player4':
        // beige
            Player1 = Hand4; Player2 = Hand1; Player3 = Hand2; Player4 = Hand3;
            break;
    }
    sortHand();
    displayCards();
    currentBidder = nextPlayer[dealer];
    listenToBids();
    $(".setupModule").hide();
    $("#bidArea").show();
    if (playerNum==currentBidder) {
      alert("Your Turn to Bid");
    }
  });
  socketio.on('cardPlayed', function(data) {
    var player = data.player;
    var card = data.card;

    if (playerNum!=lead && player == lead) {
      $(".plays").empty();
    }
    switch(true) {
      case ((playerNum=="Player1") && (player=="Player2")): othersPlayed("leftPlay",card); break;
      case ((playerNum=="Player1") && (player=="Player3")): othersPlayed("acrossPlay",card); break;
      case ((playerNum=="Player1") && (player=="Player4")): othersPlayed("rightPlay",card); break;

      case ((playerNum=="Player2") && (player=="Player3")): othersPlayed("leftPlay",card); break;
      case ((playerNum=="Player2") && (player=="Player4")): othersPlayed("acrossPlay",card); break;
      case ((playerNum=="Player2") && (player=="Player1")): othersPlayed("rightPlay",card); break;

      case ((playerNum=="Player3") && (player=="Player4")): othersPlayed("leftPlay",card); break;
      case ((playerNum=="Player3") && (player=="Player1")): othersPlayed("acrossPlay",card); break;
      case ((playerNum=="Player3") && (player=="Player2")): othersPlayed("rightPlay",card); break;

      case ((playerNum=="Player4") && (player=="Player1")): othersPlayed("leftPlay",card); break;
      case ((playerNum=="Player4") && (player=="Player2")): othersPlayed("acrossPlay",card); break;
      case ((playerNum=="Player4") && (player=="Player3")): othersPlayed("rightPlay",card); break;
      default: break;
    }
    if (currentPlayer == lead) {
      leadSuit = card.charAt(0);
    }
    if (nextPlayer[currentPlayer] == lead) {
      winRound();
    }

    currentPlayer = nextPlayer[currentPlayer];
  });
  socketio.on('winnerOfRound', function(player) {
    numRounds++;
    lead = player;
    currentPlayer = player;
    switch(true) {
      //Player1
      case ((playerNum=="Player1") && (player=="Player2")):
            addWin("leftStuff");
            break;
      case ((playerNum=="Player1") && (player=="Player3")):
            addWin("acrossStuff");
            roundWins++;
            break;
      case ((playerNum=="Player1") && (player=="Player4")):
            addWin("rightStuff");
            break;
      //Player2
      case ((playerNum=="Player2") && (player=="Player3")):
            addWin("leftStuff");
            break;
      case ((playerNum=="Player2") && (player=="Player4")):
            addWin("acrossStuff");
            roundWins++;
            break;
      case ((playerNum=="Player2") && (player=="Player1")):
            addWin("rightStuff");
            break;
      //Player3
      case ((playerNum=="Player3") && (player=="Player4")):
            addWin("leftStuff");
            break;
      case ((playerNum=="Player3") && (player=="Player1")):
            addWin("acrossStuff");
            roundWins++;
            break;
      case ((playerNum=="Player3") && (player=="Player2")):
            addWin("rightStuff");
            break;
      //Player4
      case ((playerNum=="Player4") && (player=="Player1")):
            addWin("leftStuff");
            break;
      case ((playerNum=="Player4") && (player=="Player2")):
            addWin("acrossStuff");
            roundWins++;
            break;
      case ((playerNum=="Player4") && (player=="Player3")):
            addWin("rightStuff");
            break;
      default: break;
    }

    if (numRounds == 13) {
      calculateWinner();
    }
  });
  socketio.on('some1Bid', function(data) {
    passCount=0;
    currentBidder = nextPlayer[currentBidder];
    currentBid = data.bid;
    otherColor = data.color;
    $('#'+data.bid).trigger('click');
    if (playerNum==currentBidder) {
      alert("Your Turn to Bid");
    }
  });
  socketio.on('some1Passed', function() {
    passCount++;
    if (passCount==4) {
      $('#bidOfRound').html('<b>'+currentBidder+": "+currentBid+'</b>');
      trumpSuit = currentBid.charAt(1);
      if (playerNum == currentBidder || playerNum == nextPlayer[nextPlayer[currentBidder]]) {
        handsNeeded = 6+Number(currentBid.charAt(0));
      }
      else {
        handsNeeded = 14-(6+Number(currentBid.charAt(0)));
      }
      currentPlayer = nextPlayer[currentBidder];
      lead = currentPlayer;
      $('#bidArea').hide();
      if (playerNum == currentPlayer) {
        alert("You lead");
      }
      $('#bidOfRound').show();
    }
    else {
      currentBidder = nextPlayer[currentBidder];
      if (playerNum==currentBidder) {
        alert("Your Turn to Bid");
      }
    }
  });
  socketio.on('message', function(data) {
    var msg = data.msg;
    var nickname = data.nickname;
    var chatBox = $("#chatBox");
    var textBox= $("#msgBox");
    textBox.append("<span><b>"+nickname+":</b>&emsp;"+msg+"</span><br><br>");
    scrollToBottom();
    $('#boxBottom').show();
  });
});

function clearSetupModule() {
  var setupModule = document.getElementsByClassName("setupModule")[0];
  while (setupModule.firstChild) {
    setupModule.removeChild(setupModule.firstChild);
  }
}

function joinRoom() {
  roomID = $("#roomID").val();
  pLeft = 4;
  if (roomID == '') {
    alert('RoomID must be 1-4 characters long');
  }
  else {
    socketio.emit('create', roomID);
    clearSetupModule();
    var roomText = document.createElement("span");
    roomText.setAttribute("id","roomText");
    roomText.appendChild(document.createTextNode("Room Code: "+roomID));
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
  playerSetup.setAttribute("id","playerSetup");
  var nickname = document.createElement("input");
  nickname.setAttribute("type", "text");
  nickname.setAttribute("id", "nickname");
  //create buttons for Player Selection
  var Player1 = document.createElement("input");
  Player1.setAttribute("type", "button");
  Player1.setAttribute("id", "Player1");
  Player1.setAttribute("class","playerBtns");
  Player1.setAttribute("value","Player 1");

  var Player2 = document.createElement("input");
  Player2.setAttribute("type", "button");
  Player2.setAttribute("id", "Player2");
  Player2.setAttribute("class","playerBtns");
  Player2.setAttribute("value","Player 2");

  var Player3 = document.createElement("input");
  Player3.setAttribute("type", "button");
  Player3.setAttribute("id", "Player3");
  Player3.setAttribute("class","playerBtns");
  Player3.setAttribute("value","Player 3");

  var Player4 = document.createElement("input");
  Player4.setAttribute("type", "button");
  Player4.setAttribute("id", "Player4");
  Player4.setAttribute("class","playerBtns");
  Player4.setAttribute("value","Player 4");

  var span1 = document.createElement("span");
  var span2 = document.createElement("span");

  span1.appendChild(document.createTextNode("NICKNAME:"));
  span2.appendChild(document.createTextNode("SELECT PLAYER: (TEAMS: 1and3 & 2and4)"));

  playerSetup.appendChild(span1);
  playerSetup.appendChild(document.createElement("br"));
  playerSetup.appendChild(nickname);
  playerSetup.appendChild(document.createElement("br"));
  playerSetup.appendChild(document.createElement("br"));
  playerSetup.appendChild(span2);
  playerSetup.appendChild(document.createElement("br"));

  playerSetup.appendChild(Player1);
  playerSetup.appendChild(document.createElement("br"));

  playerSetup.appendChild(Player2);
  playerSetup.appendChild(document.createElement("br"));

  playerSetup.appendChild(Player3);
  playerSetup.appendChild(document.createElement("br"));

  playerSetup.appendChild(Player4);
  $(".setupModule:eq(0)").append(playerSetup);
  playerSelect();
}

function playerSelect() {
    $(".playerBtns").on("click", function() {
      playerNum = $(this).attr('id');
      nickname = String($("#nickname").val());
      if (nickname == '' || nickname == player1NN || nickname == player2NN || nickname == player3NN || nickname == player4NN) {
        alert('Pick a unique Nickname!');
      }
      else {
        $("#playerSetup").hide();
        $(".setupModule:eq(0)").html("<div class='loading'>Waiting for Teams</div>");
        var boldNames = document.createElement("b");
        boldNames.appendChild(document.createTextNode(playerNum+': '+nickname));
        $('#topbar').append('<br/>');
        $("#topbar").append(boldNames);
        pLeft--;
        socketio.emit('selPlayer', {nickname: nickname, playerNum:playerNum, roomID: roomID, pLeft:pLeft});
        $('#chat').show();
        switch(playerNum) {
            case 'Player1':  playerColor='#5642f4'; break;
            case 'Player2':  playerColor='#e00d10'; break;
            case 'Player3':  playerColor='#123496'; break;
            case 'Player4':  playerColor='#75221f'; break;
        }
      }
    });
}

function addWin(who) {
  var stuff =$('#'+who);
  var card = document.createElement("div");
  card.setAttribute('class','otherCards');
  $(".cardback:eq(0)").clone().show().appendTo(card);
  stuff.append(card);
}

function calculateWinner() {
  var win = roundWins<handsNeeded ? 0:1;
  if (win) {
    $('#winners').html('<b>WINNER:</b> YOU');
  }
  else {
    $('#winners').html('<b>WINNER:</b> NOT YOU');
  }
  $('#gameBid').html('<b>BID:</b> '+currentBid+' ('+currentBidder+')');
  $('#wins').html('<b>YOU WON:</b> '+roundWins+' hands');
  refreshTeamWins(win);
  dealer = nextPlayer[dealer];
  currentPlayer = '', lead ='', leadSuit ='', trumpSuit ='', handsNeeded ='', roundWins = 0, numRounds = 0;
  $('#gameRecap').show();
}

function refreshTeamWins(win) {
  switch(win) {
    case 0:
      var numWins = $('#leftWin').html();
      numWins = Number(numWins)+1;
      $('#leftWin').html(numWins);
      $('#rightWin').html(numWins);
      break;
    case 1:
      var numWins = $('#acrossWin').html();
      numWins = Number(numWins)+1;
      $('#myWin').html('Team Wins: '+numWins);
      $('#acrossWin').html(numWins);
      break;
  }
}

function scrollToBottom() {
  var divObj = $("#msgBox");
  divObj.scrollTop($(divObj)[0].scrollHeight);
}
