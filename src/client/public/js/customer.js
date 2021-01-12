let orderInformation = {};
let filteredOrderInformation = {};
let currentOrder = {};

$(document).ready(() => {
  $('#game-info-container').gameInfo({ positionName: 'Customer' });
  checkOrders();
  initImages();
  initButtons();
  chooseFile();
});

function initImages() {
  $('#1').click(e => {
    changeCarType(1);
    $('#confirm-standard-order-modal').modal('show');
  });
  $('#2').click(e => {
    changeCarType(2);
    $('#confirm-standard-order-modal').modal('show');
  });
  $('#3').click(e => {
    changeCarType(3);
    $('#confirm-standard-order-modal').modal('show');
  });
  $('#4').click(e => {
    changeCarType(4);
    $('#confirm-standard-order-modal').modal('show');
  });
}

function filterOrders(orderInfo, includeInProgress, includeInspection, includeSent)
{
  return orderInfo.filter((elem) => {
    return ((includeInProgress && elem.status === 'In Progress')
      || (includeInspection && elem.status === 'Completed' && elem.stage === 'Inspection')
      || (includeSent && elem.status === 'Completed' && elem.stage === 'Sent to Customer')
    );
  });
}

function updateFilteredOrdersFromPage()
{
  let filterOptionNodes = $('#filter-options').children('input');
  filteredOrderInformation = filterOrders(orderInformation,
    filterOptionNodes.filter('#in-progress')[0].checked,
    filterOptionNodes.filter('#ready-for-inspection')[0].checked,
    filterOptionNodes.filter('#sent-to-customer')[0].checked
  );
}

function initButtons() {
  $('#view-model').click((e) => {
    if (!$('#view-model').hasClass('disabled'))
      window.location.href = '/viewer/' + getPin() + '/' + currentOrder._id;
  });

  $('.ok.button').click((e) => {
    sendOrder();
  });

  $('#generate').click(e => {
    let randNum = Math.floor(Math.random() * 4) + 1;
    changeCarType(randNum);

    sendOrder();
  });

  $('#order').click((e) => {
    $('#ready-order').modal('toggle');
  });

  $('#left').click(e => {
    let index = filteredOrderInformation.indexOf(currentOrder);
    currentOrder = --index < 0 ? filteredOrderInformation[filteredOrderInformation.length - 1] : filteredOrderInformation[index];
    updateOrderUI();
  });

  $('#right').click(e => {
    let index = filteredOrderInformation.indexOf(currentOrder);
    currentOrder = ++index == filteredOrderInformation.length ? filteredOrderInformation[0] : filteredOrderInformation[index];
    updateOrderUI();
  });

  $('#filter-options').children('input').change(() => {
    updateFilteredOrdersFromPage();
    updateCurrentOrderInfo();
    updateOrderUI();
  });

  $('.modal-close-button').on('click', function() {
    $(this).closest('.modal').modal('hide');
  });
}

// gets the pin from the url
function getPin() {
  return /(\d+)(?!.*\d)/g.exec(window.location.href)[0];
}

function changeCarType(number) {
  let dom = $('#car-type').html(number.toString());
}

function showOrderSentModal()
{
  $('#order-success-modal').modal('show');
}

function sendOrder() {
  let type = $('#car-type').html();

  let formData = new FormData();
  formData.append('model', type);
  GameAPI.postCustOrder(formData).then(showOrderSentModal);
}

/**
 * Function that runs constantly to update the orders
 */
function checkOrders() {
  GameAPI.getCustOrders().then((data) => {
    orderInformation = data;
    updateFilteredOrdersFromPage();
    updateCurrentOrderInfo();
    updateOrderUI();
  }).catch((xhr, status, error) => {
    console.log('Error: ' + error);
  });

  setTimeout(checkOrders, 3000);
}

function updateCurrentOrderInfo()
{
  if(filteredOrderInformation.length === 0)
  {
    currentOrder = null;
  }
  else {
    if (currentOrder != null && !(jQuery.isEmptyObject(currentOrder))) {
      let findObj = filteredOrderInformation.find((elem) => {
        return elem._id === currentOrder._id;
      });

      currentOrder = (findObj ? findObj : filteredOrderInformation[0]);
    } else {
      currentOrder = filteredOrderInformation[0];
    }
  }
}

function updateOrderUI() {
  if(currentOrder === null)
  {
    $('#order-display').hide();
    $('#no-order-message').removeClass('hidden');
    $('#left,#right').addClass('disabled');
  }
  else {
    $('#order-display').show();
    $('#no-order-message').addClass('hidden');
    $('#left,#right').removeClass('disabled');

    if(currentOrder.isCustomOrder)
    {
      $('#order-image').attr('src', `${GameAPI.rootURL}/gameLogic/getCustomOrderImage/${getPin()}/${currentOrder._id}`);
    }
    else
    {
      $('#order-image').attr('src', `/../images/Option ${currentOrder.modelID}.PNG`);
    }

    let orderNode = $('#order-info').empty();

    orderNode.append('<p>Date Ordered: ' + new Date(currentOrder.createDate).toString() + '</p>')
        .append('<p>Last Modified: ' + new Date(currentOrder.lastModified).toString() + '</p>');

    if (currentOrder.status === 'Completed') {
      orderNode.append('<p>Finished: ' + new Date(currentOrder.finishedTime).toString() + '</p>');
      $('#view-model').removeClass('disabled');
    } else {
      $('#view-model').addClass('disabled');
    }

    if(!(currentOrder.isCustomOrder)) {
      orderNode.append('<p>Model ID: ' + currentOrder.modelID + '</p>');
    }

    orderNode.append('<p>Stage: ' + currentOrder.stage + '</p>')
        .append('<p>Status: ' + currentOrder.status + '</p>');

    if(currentOrder.isCustomOrder)
    {
      orderNode.append('<span>Description:</span>')
        .append($('<p></p>').text(currentOrder.orderDesc));
    }

    orderNode.append('<br>');
  }
}

function updateRealFileBtnPos()
{
  let customBtn = $('#file-button');

  $('#real-file').css('top', (customBtn.position().top + (customBtn.outerHeight() * 0.8)))
      .css('left', (customBtn.position().left + (customBtn.outerWidth() * 0.5)));
}

function chooseFile(){
  const realFileBtn = document.getElementById("real-file");
  const customBtn = document.getElementById("file-button");
  const customTxt = document.getElementById("custom-text");
  customBtn.addEventListener("click", function(){
    realFileBtn.click();
  });
  realFileBtn.addEventListener("change",function(){
    if(realFileBtn.value){
      customTxt.innerHTML = realFileBtn.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
    }
    else {
      customTxt.innerHTML = "No file chosen.";
    }
  });

  updateRealFileBtnPos();
  $(window).on('resize', updateRealFileBtnPos);

  let orderForm = $('#custom-order-form');
  orderForm.attr('action', `${GameAPI.rootURL}/sendOrder`).on('submit', (event) => {
    event.preventDefault();
    let formInfo = new FormData(orderForm[0]);

    orderForm.children('#custom-order-submit').addClass('loading');
    GameAPI.postCustOrder(formInfo).then(showOrderSentModal)
        .always(() => {
          orderForm.children('#custom-order-submit').removeClass('loading');
    });
  });
}
