let manufacturingPieces = [];
let orderInformation = {};
let currentOrder = {};

$(document).ready(() => {
  $('#game-info-container').gameInfo({ positionName: 'Supplier' });

  $('#supply-grid').partGrid();

  initButtons();
  $('#order').click(e => openModal());
  $('#request').click(e => openManufacturingModal());
  checkOrders();
});

function initButtons() {
  $('#left').click(e => {
    let index = orderInformation.indexOf(currentOrder);
    currentOrder = --index < 0 ? orderInformation[orderInformation.length - 1] : orderInformation[index];
    updateOrder();
  });

  $('#right').click(e => {
    let index = orderInformation.indexOf(currentOrder);
    currentOrder = ++index == orderInformation.length ? orderInformation[0] : orderInformation[index];
    updateOrder();
  });

  $('#send-supply-order').click(e => {
    if (checkSupplyMatchesManufacturer()) {
      $('#error-message').addClass('hidden');
      sendSupplyOrder();
    }
    else {
      $('#error-message').removeClass('hidden');
    }
  });
}

// the supply order needs to match (it can have more pieces) the manufacturer order
function checkSupplyMatchesManufacturer() {
  let partCounts = $('#supply-grid').partGrid('getCounts');
  for (let i = 0; i < currentOrder.manufacturerReq.length; i++) {
    if (partCounts[currentOrder.manufacturerReq[i].partID] < currentOrder.manufacturerReq[i].count) return false;
  }
  return true;
}

function sendSupplyOrder() {
  let orderData = [],
      partCounts = $('#supply-grid').partGrid('getCounts'),
      partColors = $('#supply-grid').partGrid('getColors');

  Object.keys(partCounts).map(value => parseInt(value)).forEach((thisPartID) => {
    if(partCounts[thisPartID] > 0) {
      orderData.push({
        partID: thisPartID,
        color: partColors[thisPartID],
        count: partCounts[thisPartID],
      });
    }
  });

  GameAPI.sendSupplyOrder(currentOrder._id, orderData).then((data) => {
    console.log('Order sent!');
    $('#ready-order').modal('toggle');
    $('#supply-grid').partGrid('reset');
  }).catch((xhr, status, error) => {
    console.log(error);
  });
}

/**
 * Function that runs constantly to update the orders
 */
function checkOrders() {
  GameAPI.getSupplyOrders().then((data) => {
    orderInformation = filterOrders(data);
    updateCurrentOrderInfo();
    updateOrder();
  }).catch((xhr, status, error) => {
    console.log('Error: ' + error);
  });

  // checkRequestedPieces();
  setTimeout(checkOrders, 3000);
}

function filterOrders(orders) {
  return (orders.filter((elem) => {
    return (elem.status === "In Progress");
  }));
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

/**
 * Because including other functions in es5 is shit,
 * I moved 3 functions to supplyGrid since the manufacturer.js also requires the same functions
 * I ended up needing to change the function for the supplier.js lol 
 * i still stand by my point that es5 sucks
 */

function openManufacturingModal() {
  if (manufacturingPieces.length == 0) 
    $('#no-request').modal('toggle');
  else 
    $('#ready-request').modal('toggle');
}

/*function checkRequestedPieces() {
  $.ajax({
  type: 'GET',
  url: GameAPI.rootURL + '/gameLogic/getManufacturerRequest/' + getPin() + '/' + currentOrder._id,
  success: (data) => {
    if (data.length != 0) {
      manufacturingPieces = data;
      populateRequestData(manufacturingPieces);
    }
  },
  error: (xhr, status, error) => {
    console.log(error);
  }
  });
}

function populateRequestData(data) {
  let html = "";
  data.forEach((elem, i) => {
    if (elem != 0) {
      html += '<div class="item">' + elem + ' - ' + names[i] + '</div>';
    }
  });
  $('#requested-pieces').html(html);
}*/

 function openModal() {
  if (jQuery.isEmptyObject(orderInformation)) {
    $('#no-orders').modal('show');
  }
  else {
    $('#ready-order').modal('show');
  }
}

function updateOrder() {
  let orderNode = $('#order-info').empty();

  orderNode.append($('<p></p>').text('Ordered by: ' + (currentOrder.createdBy ? currentOrder.createdBy : '<Anonymous Player>')))
      .append('<p>Date Ordered: ' + new Date(currentOrder.createDate).toString() + '</p>')
      .append('<p>Last Modified: ' + new Date(currentOrder.lastModified).toString() + '</p>')
      .append('<p>Status: ' + currentOrder.status + '</p>')
      .append('<p>Requested Parts:</p>');

  currentOrder.manufacturerReq.forEach(value => {
    orderNode.append(`<p>${value.count} ${partProperties.PARTS[value.partID].name} (${BrickColors.findByColorID(value.color).colorName} (${value.color}))</p>`);
  });

  orderNode.append('<br>');
}