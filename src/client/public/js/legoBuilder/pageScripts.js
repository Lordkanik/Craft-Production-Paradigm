let pieces = [];
// let pieceIndex = -1; // used to modify the supply of the piece type
let orderInformation = {};
let currentOrder = {};
// let colors = [];

$(document).ready(() => {
  let currentStation = getStation();
  let positionName = (currentStation === null ? 'Assembler' : currentStation.getPlayerPosition().name);
  $('#game-info-container').gameInfo({ positionName: positionName, orientation: $.gameInfo.Orientation.HORIZONTAL});
  initButtons();
  checkOrders();
  setInterval(checkPieces, 3000);
});

function initButtons() {
  $('#left').click(e => {
    let index = orderInformation.indexOf(currentOrder);
    currentOrder = --index < 0 ? orderInformation[orderInformation.length - 1] : orderInformation[index];
    updateOrderUI();
  });

  $('#right').click(e => {
    let index = orderInformation.indexOf(currentOrder);
    currentOrder = ++index == orderInformation.length ? orderInformation[0] : orderInformation[index];
    updateOrderUI();
  });

  $('#order').click(e => {openModal()});
  $('#controls').click(e => {displayControls()});

  $('#send-model').click(e => {
    if (!$.isEmptyObject(objects)) {
      sendGroup();
    }
  });
}

/*function cycle() {
  let index = allModels.indexOf(currentObj);
  currentObj = ++index == allModels.length ? allModels[0] : allModels[index];
  loadRollOverMesh();
}*/

/*
function getModel(partID) {
  currentObj = allModels[partID];
  loadRollOverMesh();
}
 */

//======================================================================================================
//                                    Order Functions
//======================================================================================================

function displayControls(){
$('#control-list').modal('show');

}
function openModal() {
  if (jQuery.isEmptyObject(orderInformation))
    $('#no-orders').modal('show');
  else
    $('#ready-order').modal('show');
}

function updateCurrentOrderInfo()
{
  if(orderInformation.length === 0)
  {
    currentOrder = null;
  }
  else {
    if (currentOrder != null && !(jQuery.isEmptyObject(currentOrder))) {
      let findObj = orderInformation.find((elem) => {
        return elem._id === currentOrder._id;
      });

      currentOrder = (findObj ? findObj : orderInformation[0]);
    } else {
      currentOrder = orderInformation[0];
    }
  }
}

function updateOrderUI() {
  let orderNode = $('#order-info').empty();

  if(currentOrder) {
    if (currentOrder.isCustomOrder) {
      $('#order-image').attr('src', `${GameAPI.rootURL}/gameLogic/getCustomOrderImage/${GameAPI.getPin()}/${currentOrder._id}`);
    } else {
      $('#order-image').attr('src', `/../images/Option ${currentOrder.modelID}.PNG`);
    }

    orderNode.append($('<p></p>').text('Ordered by: ' + (currentOrder.createdBy ? currentOrder.createdBy : '<Anonymous Player>')))
        .append('<p>Date Ordered: ' + new Date(currentOrder.createDate).toString() + '</p>')
        .append('<p>Last Modified: ' + new Date(currentOrder.lastModified).toString() + '</p>');

    if (currentOrder.status === 'Completed') {
      orderNode.append('<p>Finished: ' + new Date(currentOrder.finishedTime).toString() + '</p>');
      $('#view-model').removeClass('disabled');
    } else {
      $('#view-model').addClass('disabled');
    }

    if (!(currentOrder.isCustomOrder)) {
      orderNode.append('<p>Model ID: ' + currentOrder.modelID + '</p>');
    }

    orderNode.append('<p>Stage: ' + currentOrder.stage + '</p>')
        .append('<p>Status: ' + currentOrder.status + '</p>');

    if (currentOrder.isCustomOrder) {
      orderNode.append('<span>Description:</span>')
          .append($('<p></p>').text(currentOrder.orderDesc));
    }

    orderNode.append('<br>');
  }
}

function checkOrders() {
  GameAPI.getCustOrders().then((data) => {
    orderInformation = filterOrders(data);

    updateCurrentOrderInfo();
    updateOrderUI();
  }).catch((xhr, status, error) => {
    console.log('Error: ' + error);
  });

  setTimeout(checkOrders, 3000);
}

function filterOrders(orders) {
  return (orders.filter((elem) => {
    return (elem.stage === "Assembler");
  }));
}

function sendGroup() {
  let exporter = new THREE.GLTFExporter();
  let options = {
    onlyVisible: false
  };

  let objGroup = new THREE.Group();
  objects.forEach((elem) => {
    objGroup.children.push(elem);
  });
  let boundingBox = (new THREE.Box3()).setFromObject(objGroup);
  let midPoint = (new THREE.Vector3()).copy(boundingBox.min).add(boundingBox.max).multiplyScalar(0.5);
  let negatedMidPoint = (new THREE.Vector3()).copy(midPoint).multiplyScalar(-1);

  objects.forEach((elem) => {
    elem.position.add(negatedMidPoint);
  });

  exporter.parse(objects, gltf => {
    console.log(gltf);
    let postData = {'model': JSON.stringify(gltf)};
    
    GameAPI.sendAssembledModel(currentOrder._id, gltf).then((data) => {
      console.log(data);
      let elemsToRemove = [];
      scene.children.forEach(elem => {
        if (elem.type === 'Mesh' && elem.name !== 'plane' && elem.name !== 'Environment')
          elemsToRemove.push(elem);
      });

      elemsToRemove.forEach(elem => {
        scene.remove(elem);
      });

      objects.length = 0;
      collisionObjects = collisionObjects.filter((elem) => {
        return (elem.name === 'plane');
      });
    }).catch((xhr, status, error) => {
      objects.forEach((elem) => {
        elem.position.add(midPoint);
      });

      console.log('Group Error: ' + error);
    });
  }, options);
}

//======================================================================================================
//                                    Supply Grid Stuff
//======================================================================================================

function checkPieces() {
  GameAPI.getAssemblerParts().then((data) => {
    if (data != null && data != undefined && data != "") {
      if (!samePieces(data, pieces)) {
        pieces = data;
        updateBinParts();
      }
    }
  }).catch((xhr, status, error) => {
    console.log(error);
  });
}

/*
function openSupplyModal() {
  checkPieces();
  updatePieces();
  if (pieces.length === 0)
    $('#no-pieces').modal('show');
  else
    $('#pieces-modal').modal('show');
}
 */

// finds how many actual types of pieces there are
/*function getNumOfPieceTypes(pieceArray) {
  let num = 0;
  pieceArray.forEach(elem => {num += elem == 0 ? 0 : 1});
  return num;
}*/

function samePieces(array1, array2) {
  if (array1 == null || array2 == null) return false;
  if (array1.length !== array2.length) return false;
  for (let i = 0; i < array1.length; i++) {
    if(array1[i].partID !== array2[i].partID
    || array1[i].color !== array2[i].color
    || array1[i].count !== array2[i].count)
    {
      return false;
    }
  }
  return true;
}

function updatePieces(pageUnloading) {
  return GameAPI.setAssemblerParts(pieces, pageUnloading).catch((xhr, status, error) => {
    console.log(error);
  });
}

function getStation()
{
  let urlFragment = window.location.hash;

  if(urlFragment.length >= 1)
  {
    urlFragment = urlFragment.slice(1);
  }

  let stationObj = null;

  Object.keys(partProperties.STATIONS).find(value => {
        if(partProperties.STATIONS[value].internalName === urlFragment)
        {
          stationObj = partProperties.STATIONS[value];
          return true;
        }
        else
        {
          return false;
        }
  });

  return stationObj;
}
/*
function initSupplyButtons() {
  for (let i = 0; i < pieces.length; i++) {
    let num = '#' + i;
    $(num + '-button').click(function() {
      let partID = parseInt($(this).data('part-id'));
      $('#pieces-modal').modal('toggle');
      pieceIndex = i;
      getModel(partID);
    });
  }
}
 */

/*function getColors() {
  $.ajax({
    type: 'GET',
    url: GameAPI.rootURL + '/gameLogic/colors/' + getPin() + '/' + currentOrder._id,
    success: data => {
      colors = data;
    },
    error: (xhr, status, error) => {
      console.log(status, error);
    }
  });
}*/

/*
function generatePiecesGrid() {
  let html = "";
  // this is to ensure that I'm not appended to previous information
  $('#supply-grid').html(html);
  let i = 0;
  let num = pieces.length;
  for (let row = 0; row < num / 4; row++) {
    html = '<div class="row">';
    for (let col = 0; col < 4; col++) {
      if (row * 4 + col < num) {
        html += '<div class="four wide text-center column">';
        html += '<p id="' + (row * 4 + col) + '-name" class="part-name-text">' + names[pieces[i].partID] + '</p>';
        html += '<p id="' + (row * 4 + col) + '-color">(' + BrickColors.findByColorID(pieces[i].color).colorName + ')</p>';
        html += '<div class="row"><div class="ui statistic"><div id="' + i + '-value';
        html += '"class="value">' + pieces[i].count + '</div></div></div>';
        html += '<button class="ui button" id="' + (row * 4 + col) + '-button" data-part-id="' + pieces[i].partID + '">Place</button></div>';
        i++;
      }
    }
    // I want there to be vertical lines between each cube so I need to add a blank space
    if (num % 4 != 0 && row + 1 > num / 4) {
      let size = "";
      switch(num % 4) {
        case 1: size = 'twelve'; break;
        case 2: size = 'eight'; break;
        case 3: size = 'four'; break;
      }
      html += '<div class="' + size + ' wide column"></div>'
    }
    html += '</div>';
    $('#supply-grid').append(html);
  }

  initSupplyButtons();
}
 */
