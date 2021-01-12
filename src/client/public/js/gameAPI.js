const GameAPI = {
  rootURL: 'https://mfgsim-api.herokuapp.com',
  /**
   * @returns {string}
   */
  // gets the pin from the url
  getPin() {
    return /\/(\d+)(\/|$)/.exec(window.location.pathname)[1];
  },
  startGame(gameProperties)
  {
    return $.ajax({
      type: 'POST',
      data: gameProperties,
      dataType: 'json',
      contentType: 'application/json',
      timeout: 5000,
      url: GameAPI.rootURL + '/startGame'
    });
  },
  gamePinExists(pin)
  {
    return $.ajax({
      type: 'GET',
      cache: false,
      url: GameAPI.rootURL + '/startGame/checkIfPinExists/' + pin
    });
  },
  getAvailablePositions(pin)
  {
    return $.ajax({
      type: 'GET',
      cache: false,
      url: GameAPI.rootURL + '/startGame/getPossiblePositions/' + pin
    });
  },
  joinGame(pin, position, playerName) {
    let postData = {positionName: position, playerName: playerName};

    return $.ajax({
      type: 'POST',
      data: postData,
      url: GameAPI.rootURL + '/startGame/joinGame/' + pin,
      timeout: 5000
    });
  },
  addActivePlayer(pin)
  {
    return $.ajax({
      type: 'GET',
      timeout: 5000,
      url: GameAPI.rootURL + '/startGame/addActivePlayer/' + pin
    });
  },
  getGameInfo(pin) {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      url: GameAPI.rootURL + '/startGame/getGameInfo/' + pin,
      timeout: 3000
    });
  },
  getPlayerName(gameInfo, position) {
    position = (position ? position : sessionStorage.position);
    let findResult = gameInfo.positions.find(value => value.positionName === position);

    return (findResult !== undefined ? findResult.playerName : undefined);
  },
  removeActivePlayer(pin, position) {
    pin = (pin ? pin : GameAPI.getPin());
    position = (position ? position : sessionStorage.position);

    return $.ajax({
      type: 'GET',
      timeout: 5000,
      url: GameAPI.rootURL + '/startGame/removeActivePlayer/' + pin + '/' + position,
      success: (result) => window.location.href = '/',
      error: (error) => console.log(error)
    });
  },
  getCustOrders(pin) {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      url: GameAPI.rootURL + '/gameLogic/getOrders/' + pin,
      cache: false,
      timeout: 5000
    });
  },
  getCustOrder(orderID, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      url: GameAPI.rootURL + '/gameLogic/getOrder/' + pin + '/' + orderID
    });
  },
  acceptCustOrder(orderID, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'POST',
      url: GameAPI.rootURL + '/gameLogic/acceptOrder/' + pin + '/' + orderID
    });
  },
  rejectCustOrder(orderID, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'POST',
      url: GameAPI.rootURL + '/gameLogic/rejectOrder/' + pin + '/' + orderID
    });
  },
  /**
   *
   * @param {FormData} formData
   * @param {string} pin
   * @returns {JQuery.jqXHR}
   */
  postCustOrder(formData, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());
    formData.append('pin', pin);

    return $.ajax({
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      timeout: 5000,
      url: GameAPI.rootURL + '/gameLogic/sendOrder'
    });
  },
  forwardManufacturerOrder(orderID, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'POST',
      url: GameAPI.rootURL + '/gameLogic/forwardManufacturerOrder/' + pin + '/' + orderID,
      timeout: 5000
    });
  },
  addSupplyOrder(orderData, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    let postData = {'request': orderData};
    return $.ajax({
      type: 'POST',
      url: GameAPI.rootURL + '/gameLogic/addSupplyOrder/' + pin,
      data: JSON.stringify(postData),
      contentType: 'application/json'
    });
  },
  getAssemblerParts(pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      cache: 'false',
      url: GameAPI.rootURL + '/gameLogic/getAssemblerParts/' + pin,
      timeout: 5000
    });
  },
  setAssemblerParts(pieces, pageUnloading, pin) {
    pin = (pin ? pin : GameAPI.getPin());

    let postData = {'pieces': pieces};
    let APIUrl = GameAPI.rootURL + '/gameLogic/setAssemblerParts/' + pin;
    if (pieces != null && pieces != undefined) {
      if(pageUnloading)
      {
        let sendBeaconResult = navigator.sendBeacon(APIUrl, JSON.stringify(postData));
        return (sendBeaconResult ? Promise.resolve() : Promise.reject('sendBeacon failed'));
      }
      else {
        return $.ajax({
          type: 'POST',
          data: JSON.stringify(postData),
          contentType: 'application/json',
          url: APIUrl
        });
      }
    }
  },
  sendAssembledModel(orderID, modelObj, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    let postData = {'model': JSON.stringify(modelObj)};
    return $.ajax({
      type: 'POST',
      data: postData,
      timeout: 10000,
      url: GameAPI.rootURL + '/gameLogic/sendAssembledModel/' + pin + '/' + orderID
    });
  },
  getSupplyOrders(pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      url: GameAPI.rootURL + '/gameLogic/getSupplyOrders/' + pin,
      cache: false,
      timeout: 5000
    });
  },
  sendSupplyOrder(orderID, partArray, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    let postData = {
      order: partArray
    };

    return $.ajax({
      type: 'POST',
      data: JSON.stringify(postData),
      contentType: 'application/json',
      url: GameAPI.rootURL + '/gameLogic/sendSupplyOrder/' + pin + '/' + orderID
    });
  },
  getAssembledModel(orderID, pin)
  {
    pin = (pin ? pin : GameAPI.getPin());

    return $.ajax({
      type: 'GET',
      url: GameAPI.rootURL + '/gameLogic/getAssembledModel/' + pin + '/' + orderID
    });
  }
};
