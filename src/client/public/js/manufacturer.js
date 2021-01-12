let orderInformation = {},
    currentOrder = {};

$(document).ready(() => {
  $('#game-info-container').gameInfo({ positionName: 'Manufacturer' });

  $('#supply-grid').partGrid()
  .on('partGrid.partAdd', () => {
    $('#send-supplier-order').removeClass('disabled');
    updateCostWeight();
  }).on('partGrid.partRemove', function() {
    let partCount = $(this).partGrid('getCounts');
    let partSum = 0;
    Object.keys(partCount).forEach((elem) => {
        partSum += partCount[elem];
    });
    if(partSum <= 0)
    {
        $('#send-supplier-order').addClass('disabled');
    }
    updateCostWeight();
  });

  updateCostWeight();
  initButtons();

  $('#order').click(e => {
    openModal();
  });
  checkOrders();
});

function initButtons() {
  $('#send-manufacturing-order').on('click', () => {
    GameAPI.forwardManufacturerOrder(currentOrder._id).then(() => {
      $('#ready-order').modal('hide');
    });
  });

/*  $('.sp-palette-row .sp-thumb-el').on('click.spectrum touchstart.spectrum', function(event) {
    let partNum = parseInt($(this).closest('.picker-container').data('part-number'));
    colors[partNum] = BrickColors.allPaletteData[$(this).closest('.sp-palette-row').index()][$(this).index()].colorID;
  });*/

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

  $('#send-supplier-order').click(e => {
    $('#send-supplier-order').addClass('loading');

    sendPiecesOrder().then((data) => {
      $('#supply-grid').partGrid('reset');
      $('#send-supplier-order').addClass('disabled');


      updateCostWeight();
      $('#supply-order-sent').modal('show');
    }).catch((xhr, status, error) => {
      console.log(error);
    }).always(() => {
      $('#send-supplier-order').removeClass('loading');
    });
  });
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
 * Function that runs constantly to update the orders
 */
function checkOrders() {
  GameAPI.getCustOrders().then((data) => {
    orderInformation = data.filter((elem) => {
      return elem.stage === "Manufacturer";
    });

    updateCurrentOrderInfo();
    updateOrderUI();
  }).catch((xhr, status, error) => {
      console.log('Error: ' + error);
  });

  setTimeout(checkOrders, 3000);
}

function sendPiecesOrder() {
  let orderData = [];

  let partCounts = $('#supply-grid').partGrid('getCounts');
  let partColors = $('#supply-grid').partGrid('getColors');

  Object.keys(partCounts).map(value => parseInt(value)).forEach((thisPartID) => {
    if(partCounts[thisPartID] > 0) {
      orderData.push({
        partID: thisPartID,
        color: partColors[thisPartID],
        count: partCounts[thisPartID],
      });
    }
  });

  return GameAPI.addSupplyOrder(orderData);
}

/**
 * Because including other functions in es5 is shit,
 * I moved 3 functions to supplyGrid since the supplier.js also requires the same functions
 * I ended up needing to change the function for the supplier.js lol 
 * i still stand by my point that es5 sucks
 */

function openModal() {
  if (jQuery.isEmptyObject(orderInformation)) {
    $('#no-orders').modal('show');
  }
  else {
    $('#ready-order').modal('show');
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

function updateCostWeight()
{
  let partCounts = $('#supply-grid').partGrid('getCounts');

  $('#total-cost-text').text(`$${partProperties.totalPartCost(partCounts).toFixed(2)}`);
  $('#total-weight-text').text(partProperties.totalPartWeight(partCounts).toFixed(2));
}
