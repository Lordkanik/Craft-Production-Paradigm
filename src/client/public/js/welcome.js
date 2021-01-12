/**
 * author: Daniel Kovalevich
 * dateModified: Last time I felt like it
 */

$(document).ready(() => {
  initButtons();
  initNewGameForm();
});

function initNewGameForm()
{
  $('#position-dropdown').dropdown({
    placeholder: 'Position Type'
  });

  $('#game-type-dropdown').dropdown({
    placeholder: 'Game Type',
    values: Object.keys(GameObjects.GameTypes).map((value, index) => {
      return {value: value, name: GameObjects.GameTypes[value].name, selected: (index === 0)};
    }),
    onChange: value => {
      if(value !== '')
      {
        $('#position-dropdown').dropdown('change values',
            Object.keys(GameObjects.GameTypes[value].positions)
                .map(posID => { return {value: posID, name: GameObjects.GameTypes[value].positions[posID].name }}));
      }
    }
  });
}

function initButtons() {
  $('#new-game').click((e) => {
    e.preventDefault();
    $('#new-game-modal').modal({onApprove : onApproveNewGame}).modal('show');
  });

  $('#join-game').click((e) => {
    e.preventDefault();
    $('#join-game-modal').modal({onApprove : onApproveJoin}).modal('show');    
  });

  let checkPinTimerID = null;
  $('#pin').on('input', function(e) {
    if (checkPinTimerID !== null)
    {
      clearTimeout(checkPinTimerID);
    }

    if($(this).val().length > 0)
    {
      checkPinTimerID = setTimeout(() => {
        checkPinTimerID = null;
        checkIfPinIsValid();
      }, 1000);
    }
  });

  $('.ui.dropdown').dropdown();
}

// Handles the modal approve
// I wanted to separate the functions from the initalization itself
function onApproveNewGame() {
  console.log('sending game info to server');
  $('#start-game-submit').removeClass('right labeled icon').addClass('loading');
  let postData = getPostData();
  sendToServer(postData);
  return false; //Return false as to not close modal dialog
}

// Handles the modal approve
// I wanted to separate the functions from the initalization itself
function onApproveJoin() {
  $('#join-game-submit').removeClass('right labeled icon').addClass('loading');
  let joinPositionType = getJoinPosition();
  // if the user doesn't choice a position type
  if (joinPositionType != undefined) {
    joinGame($('#pin').val(), joinPositionType, $('#join-player-name').val());
    $('.invalid-pin').addClass('hidden');
  }
  else {
    $('#join-game-submit').removeClass('loading').addClass('right labeled icon');
    $('.invalid-pin').removeClass('hidden');
    $('.invalid-pin').html('You must choose a position type!');
  }
  return false; //Return false as to not close modal dialog
}

/**
 * Takes postData and sends to server to add to database
 * @param {Object} postData 
 */
function sendToServer(postData) {
  GameAPI.startGame(postData).then((result) => {
    window.location.href = '/startGame/' + result.pin;
  }).catch((xhr,status,error) => {
    console.log(error);
    $('#start-game-submit').removeClass('loading').addClass('right labeled icon');
  });
}

// Does what the name implies
function checkIfPinIsValid() {
  let pin = $('#pin').val();
  GameAPI.gamePinExists(pin).then((result) => {
    if (result) {
      $('.invalid-pin').addClass('hidden');
      $('#join-dropdown').removeClass('disabled');
      $('.join-player-name-container').removeClass('disabled');
      getPossiblePositions(pin);
    }
    else {
      $('#join-dropdown').addClass('disabled');
      $('.join-player-name-container').addClass('disabled');
      $('.invalid-pin').removeClass('hidden');
      $('.invalid-pin').html('That is not a valid pin!');
    }
  }).catch((xhr,status,error) => {
    console.log(error);
    console.log(pin);
    $('.invalid-pin').removeClass('hidden');
    $('.invalid-pin').html('That is not a valid pin!');
  });
}

/**
 * Database holds currently taken positions
 * Makes sure to return ones that aren't already taken
 * @param {number} pin 
 */
function getPossiblePositions(pin) {
  GameAPI.getAvailablePositions(pin).then((result) => {
    if (result.length == 0) {
      $('.invalid-pin').removeClass('hidden');
      $('.invalid-pin').html('Sorry. That game is already full.');
    }
    result.forEach(element => {
      if ($('#join-menu').children().length < result.length)
        $('#join-menu').append('<div class="item">' + element + '</div>');
    });
  }).catch((xhr, status, error) => {
    console.log(error);
  });
}

/**
 * Gets all of the field data for the post request
 */
function getPostData() {
  let name = $('#group-name').val();
  let gameTypeText = $('#game-type-dropdown').dropdown('get text');
  let gameTypeKey = Object.keys(GameObjects.GameTypes).find(
      thisKey => GameObjects.GameTypes[thisKey].name === gameTypeText);
  let position = $("#position-dropdown").dropdown('get text');
  // position = position === '' ? 'Assembler' : position;

  let data = {
    positions: [{positionName: position, playerName: $('#your-name').val()}],
    groupName: name,
    activePlayers: 1,
    status: 'waiting',
    gameType: gameTypeText
    // maxPlayers: 4 // TODO: Add support for a variable number of players?
  };

  sessionStorage.position = position;
  return JSON.stringify(data);
}

/**
 * I have to get the choice manually because stupid stuff is happening
 * when I try to just use $('#position-type').html()
 */
function getJoinPosition() {
  let children = $('#join-menu').children().toArray();
  let returnChild = null;
  children.forEach(child => {
    if ($(child).hasClass('active'))
      returnChild = child;
  });
  return $(returnChild).html();
}

/**
 * Joins a game by pin, position, and player name
 * @param {number} pin
 * @param {string} position
 * @param {string} playerName
 */
function joinGame(pin, position, playerName) {
  GameAPI.joinGame(pin, position, playerName).then(() => {
    sessionStorage.position = position;
    updateActivePlayers(pin);
  }).catch((xhr,status,error) => {
    console.log(error);
    $('#join-game-submit').removeClass('loading').addClass('right labeled icon');
  });
}

/**
 * Just increments the activePlayers value in the database
 * @param {number} pin 
 */
function updateActivePlayers(pin) {
  GameAPI.addActivePlayer(pin)
    .then((result) => window.location.href = '/startGame/' + pin)
    .catch((error) => console.log(error));
}
