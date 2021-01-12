let pin = -1;
let currentGameInfo = null;

$(document).ready(() => {
  initPage();
  initProgressAndButtons();
  updateGameInfo();
  setInterval(updateGameInfo, 3000);
});

/* 
// I can't seem to get this to work well
// It is because is removes active players on refresh
window.onbeforeunload = closingCode;
function closingCode() {
  $.ajax({
    type: 'GET',
    timeout: 5000,
    url: 'http://psu-research-api:3000/startGame/removeActivePlayer/' + pin,
    error: (error) => console.log(error)
  });
  return "Are you sure you want to close?";
}*/

function initPage() {
  pin = GameAPI.getPin();
  $('#pin').html(Number(pin).pad(4));
}

function initProgressAndButtons() {
  $('#example4').progress({
    text: {
      active  : 'Getting game ready',
      success : 'Game is ready. Hit start to begin!'
    }
  });

  $('#start-game').click(() => {
    let gameTypeInfo = GameObjects.GameTypes[Object.keys(GameObjects.GameTypes)
        .find(typeKey => GameObjects.GameTypes[typeKey].name === currentGameInfo.gameType)];
    let positionInfo = gameTypeInfo.positions[Object.keys(gameTypeInfo.positions)
        .find(typeKey => gameTypeInfo.positions[typeKey].name === sessionStorage.position)];

    window.location.href = positionInfo.getURL(pin);
  });

  $('#exit').click(() => {
    GameAPI.removeActivePlayer().then(() => window.location.href = '/').catch((error) => console.log(error));
  });
}

function updateGameInfo()
{
  return GameAPI.getGameInfo().then((data) => {
    currentGameInfo = data;
    applyGameInfo(data);
    if (data.activePlayers === data.maxPlayers)
      $('#start-game').removeClass('disabled');
  });
}

/**
 * Refreshes the game information on the page so that as people join
 * the page will update with that information
 */
function applyGameInfo(result) {
  try {
    let title = 'Group: ';
    let gameType = 'Game: ';
    let playerNamePrefix = 'Player: ';
    $('#name').text(title + result.groupName);
    $('#game-type').text(gameType + result.gameType);
    $('#player-name').text(playerNamePrefix + result.positions.find(value => (value.positionName === sessionStorage.position)).playerName);
    $('#players').text(result.activePlayers);
    $('#example4').attr('data-total', result.maxPlayers)
      .progress('set total', result.maxPlayers)
      .progress('update progress', result.activePlayers);
  } catch (e) {
    console.log('You may need to wait a second');
    console.log(e);
  }
  
}

// Create a pad function for the pin so that a pin like 12
// would show up as 0012
Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
};