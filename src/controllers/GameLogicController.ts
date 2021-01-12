/**
 * Controller handles all of the game logic
 * i.e. Things that deal with the orders
 */

import {CustOrderDatabaseConnector} from '../models/CustOrderDatabaseConnector';
import {OrderImage} from "../models/orderImage";
import {ICustomerOrder} from "../models/customerOrderSchema";
import DatabaseConnector from "../models/database";
import {SupplierOrderDatabaseConnector} from "../models/SupplierOrderDatabaseConnector";
import {ISupplierOrder} from "../models/supplierOrderSchema";
import {PartInventory} from "../models/partInventory";
import {GameController} from "./GameController";
import {IGame} from "../models/gameSchema";

export class GameLogicController {
  private gameController: GameController;
  private custOrderDBConnector: CustOrderDatabaseConnector;
  private supplierOrderDBConnector: SupplierOrderDatabaseConnector;

  constructor(dbClient: DatabaseConnector, gameController: GameController) {
    this.gameController = gameController;
    this.custOrderDBConnector = new CustOrderDatabaseConnector(dbClient);
    this.supplierOrderDBConnector = new SupplierOrderDatabaseConnector(dbClient);
  }

  public async placeOrder(pin: number, modelID: number): Promise<void> {
    let gameObj : IGame | null = await this.gameController.getGameInfo(pin);

    if(gameObj !== null) {
      let custPosition = gameObj.getCustomer();

      if(custPosition !== undefined) {
        let order = {
          pin: pin, modelID: modelID,
          createdBy: custPosition.playerName
        };
        await this.custOrderDBConnector.addOrder(order);
      }
    }
  }

  public async placeCustomOrder(pin: number, orderDesc: string, imageData: Buffer): Promise<void>
  {
    let gameObj : IGame | null = await this.gameController.getGameInfo(pin);

    if(gameObj !== null) {
      let custPosition = gameObj.getCustomer();

      if (custPosition !== undefined) {
        let order = {
          pin: pin, isCustomOrder: true, orderDesc: orderDesc, imageData: await (new OrderImage(imageData)).toBuffer(),
          createdBy: custPosition.playerName
        };
        await this.custOrderDBConnector.addOrder(order);
      }
    }
  }

  /*
  private generateOrders(pin: number, max:number, skew: number): void {
    for (let i: number = 0; i < max; i++) {
      let order = new Order(pin);
      let ID: number = Math.ceil(this.normalDistribution(skew));
      order.setModelID(ID);
      order.setStage('Manufacturer');
      this.db.addOrder(order.toJSON());
    }
  }
  */

  /**
   * Found on StackOverflow
   * https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
   * @param min 
   * @param max 
   * @param skew 
   */
/*  private normalDistribution(skew: number): number {
    const min: number = 0;
    const max: number = 4;
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = this.normalDistribution(skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
  }*/

  public async getOrder(pin: number, orderID: string): Promise<ICustomerOrder | null>
  {
    return await this.custOrderDBConnector.getOrder(pin, orderID);
  }

  public async getOrders(pin: number): Promise<Array<object>> {
    return await this.custOrderDBConnector.getOrders(pin);
  }

  public async getCustomOrderImage(pin: number, orderID: string): Promise<Buffer>
  {
    return await this.custOrderDBConnector.getCustomOrderImage(pin, orderID);
  }

  public async completeSupplyOrder(pin: number, orderId: string, parts: Array<PartInventory>): Promise<void> {
    await Promise.all([
        this.supplierOrderDBConnector.completeOrder(pin, orderId, parts),
        this.gameController.addAssemblerParts(pin, parts)
    ]);
  }

  public async forwardManufacturerOrder(pin: number, orderID: string): Promise<ICustomerOrder | null>
  {
    return this.custOrderDBConnector.setOrderStage(pin, orderID, 'Assembler');
  }

  /*public async getSupplyOrder(pin: number, orderId: string): Promise<Array<PartInventory>> {
    return await this.supplierOrderDBConnector.getSupplyOrder(pin, orderId);
  }*/

  /*public async getColors(pin: number, orderId: string): Promise<Array<any>> {
    let result = await this.custOrderDBConnector.getColors(pin, orderId);
    return result;
  }*/

/*  public updatePieces(pin: string, orderId: string, pieces: Array<number>): number {
    return this.custOrderDBConnector.updatePieces(pin, orderId, pieces);
  }*/

  public updateAssembledModel(pin: number, orderId: string, model: string): number {
    return this.custOrderDBConnector.updateAssembledModel(pin, orderId, model);
  }

  public async getAssembledModel(pin: number, orderId: string): Promise<string> {
    return await this.custOrderDBConnector.getAssembledModel(pin, orderId);
  }

/*  public async getManufacturerRequest(pin: number, orderId: string): Promise<ISupplierOrder | null> {
    return await this.supplierOrderDBConnector.getManufacturerRequest(pin, orderId);
  }*/

  public async addSupplyOrder(pin: number, request: Array<PartInventory>): Promise<ISupplierOrder> {
    console.log("At controller: " + JSON.stringify(request));

    let gameObj : IGame | null = await this.gameController.getGameInfo(pin);

    if(gameObj !== null) {
      let manufPosition = gameObj.getManufacturer();

      if (manufPosition !== undefined) {
        return this.supplierOrderDBConnector.addOrder(pin,
            manufPosition.playerName, request);
      }
      else
      {
        return Promise.reject('No manufacturer exists for this game.');
      }
    }
    else
    {
      return Promise.reject('The game specified does not exist.');
    }
  }

  public async getSupplyOrders(pin: number): Promise<Array<ISupplierOrder>>
  {
    return this.supplierOrderDBConnector.getSupplyOrders(pin);
  }

  public acceptOrder(pin: number, orderId: string): number {
    return this.custOrderDBConnector.acceptOrder(pin, orderId);
  }

  public rejectOrder(pin: number, orderId: string): number {
    return this.custOrderDBConnector.rejectOrder(pin, orderId);
  }
}