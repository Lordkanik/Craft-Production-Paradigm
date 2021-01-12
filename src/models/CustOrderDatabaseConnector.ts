/**
 * This class handles any actual game logic
 */

import DatabaseConnector from './database';
import {InsertOneWriteOpResult} from "mongodb";
import {Model, Document, DocumentQuery} from 'mongoose';
import {ICustomerOrder} from "./customerOrderSchema";

export class CustOrderDatabaseConnector {
  public orderModel: Model<ICustomerOrder>;

  constructor(dbConnection: DatabaseConnector) {
    this.orderModel = dbConnection.getCustOrderCollection();
  }

  /**
   * This will add the order to the game object's array
   * @param pin 
   * @param order JSON Object that holds all the order details
   */
  public async addOrder(order: object): Promise<ICustomerOrder> {
    let newModel = new this.orderModel(order);
    return newModel.save();
  }

  public async getOrder(pin: number, orderID: string): Promise<ICustomerOrder | null>
  {
    return this.orderModel.findOne({pin: pin, _id: orderID}, {'imageData': 0}).exec();
  }

  public async getCustomOrderImage(pin: number, orderID: string): Promise<Buffer>
  {
    let orderInfo: (ICustomerOrder | null) = await this.orderModel.findOne({pin: pin, _id: orderID}, {'imageData': 1});

    if(orderInfo)
    {
      if(orderInfo.imageData)
      {
        return Promise.resolve<Buffer>(orderInfo.imageData);
      }
      else
      {
        return Promise.reject('No image found for the requested order');
      }
    }
    else
    {
      return Promise.reject('No information found for the requested order');
    }
  }

  /**
   * Gets all of the orders that are part of the same session
   * @param pin 
   */
  public async getOrders(pin: number): Promise<Array<ICustomerOrder>> {
    try {
      return (await this.orderModel.find({pin: pin}, {'imageData': 0, 'assembledModel': 0}));
    } catch(e) {
      return new Array<ICustomerOrder>();
    }
  }

  /*// This happens at the supplier stage
  // I don't know why I have two functions that essentially do the same thing (idgaf at this point)
  // fixed: they no longer do the same thing
  public addSupplyOrder(pin: number, orderId: string, order: Array<number>, colors: Array<string>): void {
    let time: number = new Date().getTime();
    let update: Object = {$set: {supplyOrders: order, colors: colors, lastModified: time, stage: 'Assembler'}};
    this.orderModel.update({pin: parseInt(pin), _id: orderId}, update).exec();
  }*/

/*  public async getSupplyOrder(pin: number, orderId: string): Promise<Array<number>> {
    let orders = await this.orderModel.findOne({pin: parseInt(pin), _id: orderId}, {supplyOrders: 1});

    if(orders) {
      return orders.supplyOrders;
    }
    else
    {
      return new Array<number>();
    }
  }*/

  /*public async getColors(pin: number, orderId: string): Promise<Array<string>> {
    try {
      let query = {pin: parseInt(pin), _id: orderId};
      let fields = {colors: 1};
      let result = await this.orderModel.findOne(query, fields);
      if (result == null) return new Array<string>();
      return result.colors;
    } catch(e) {
      console.log(e);
      return new Array<any>();
    }
  }*/

/*  // this is used in the assembler stage
  public updatePieces(pin: string, orderId: string, pieces: Array<number>): number {
    if (pieces != null && pieces != undefined) {
      let time: number = new Date().getTime();
      let update: Object = {$set: {supplyOrders: pieces, lastModified: time}};
      this.orderModel.update({pin: parseInt(pin), _id: orderId}, update).exec();
      return 200;
    }
    return 400;
  }*/

  /**
   * Updates the assembled model in the database
   * Also assumed that the process has been finishes so status is changed
   * and time completed is recorded
   * @param pin 
   * @param orderId 
   * @param model 
   */
  public updateAssembledModel(pin: number, orderId: string, model: string): number {
    if (model != null && model != undefined) {
      let time: number = new Date().getTime();
      let update: Object = {$set: {assembledModel: model, status: 'Completed', finishedTime: time, stage: 'Inspection'}};
      this.orderModel.update({pin: pin, _id: orderId}, update).exec();
      return 200;
    }
    return 400;
  }
  
  public async getAssembledModel(pin: number, orderId: string): Promise<string> {
    try {
      let query: Object = {pin: pin, _id: orderId.toString()};
      let projection: Object = {assembledModel: 1};
      let foundOrder: (ICustomerOrder | null) = await this.orderModel.findOne(query, projection);

      if(foundOrder)
      {
        return foundOrder.assembledModel;
      }
      else
      {
        return '';
      }

    } catch(e) {
      console.log(e);
      return '';
    }
  }

  /*
  public async getManufacturerRequest(pin: number, orderId: string): Promise<Array<number>> {
    try {
      let request: (ICustomerOrder | null) = await this.orderModel.findOne({pin: parseInt(pin), _id: orderId}, {manufacturerReq: 1});
      if(request) {
        return request.manufacturerReq;
      }
      else
      {
        return new Array<number>();
      }
    } catch(e) {
      return new Array<number>();
    }
  }
  */
  
  /**
   * Once the manufacturer request is sent, the time modified is updated and the game goes to the supplier stage
   * @param pin 
   * @param orderId 
   * @param request 
   */
  /*public updateManufacturerRequest(pin: number, orderId: string, request: Array<number>): number {
    if (request != null && request != undefined) {
      let time: number = new Date().getTime();
      let update: Object = {$set: {manufacturerReq: request, stage: 'Supplier', lastModified: time}};
      this.orderModel.update({pin: parseInt(pin), _id: orderId}, update).exec();
      return 200;
    }
    return 400;
  }*/

  public acceptOrder(pin: number, orderId: string)
  {
    try {
      let update: Object = {$set: {status: 'Completed', stage: 'Sent to Customer'}};
      this.orderModel.update({pin: pin, _id: orderId}, update).exec();
      return 200;
    } catch(e) {
      return 400;
    }
  }

  public async setOrderStage(pin: number, orderID: string, newStage: string): Promise<ICustomerOrder | null>
  {
    let time: number = new Date().getTime();
    return this.orderModel.findOneAndUpdate({pin: pin, _id: orderID}, {
      $set: {
        lastModified: time,
        stage: newStage
      }
    }).exec();
  }

  /**
   * If the user doesn't approve the model, the customer order will be sent back to the manufacturer stage
   * @param pin 
   * @param orderId 
   */
  public rejectOrder(pin: number, orderId: string): number {
    try {
      let time: number = new Date().getTime();
      let update: Object = {$set: {status: 'In Progress', stage: 'Manufacturer', lastModified: time, assembledModel: null, finishedTime: -1}};
      this.orderModel.update({pin: pin, _id: orderId}, update).exec();
      return 200;
    } catch(e) {
      return 400;
    }
  }
}