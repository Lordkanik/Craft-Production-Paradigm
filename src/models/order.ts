import {OrderImage} from './orderImage';

class CustomOrderInfo
{
  public orderDesc: string;
  public orderImage: OrderImage;

  constructor(desc: string, image: OrderImage)
  {
    this.orderDesc = desc;
    this.orderImage = image;
  }
}

export default class Order {
  private _id: string;
  private pin: number;
  private createDate: number;
  private lastModified: number;
  private finishedTime: number;
  // 3 Possible statuses
  // In Progress -> Order is being worked on
  // Completed -> As the name implies
  // Canceled -> Feature to be added later
  private status: string;
  // 4 Stages of Production
  // Customer -> Manufacturer -> Supplier -> Assembler -> Customer
  private stage: string;
  private modelID: number;
  private customOrderInfo: (CustomOrderInfo | null) = null;
  private manufacturerReq: Array<number>;
  private supplyOrders: Array<number>;
  private assembledModel: object;
  private colors: Array<any>;
  constructor(pin: number) {
    this.pin = pin;
    this._id = this.generateId();
    this.createDate = new Date().getTime();
    this.status = "In Progress";
    this.stage = "Manufacturer";
    this.modelID = -1;
    this.lastModified = this.createDate;
    this.finishedTime = -1;
    this.manufacturerReq = new Array<number>();
    this.supplyOrders = new Array<number>();
    this.assembledModel = {};
    this.colors = new Array<any>();
  }

  private setLastModified(): void {
    this.lastModified = new Date().getTime();
  }

  private setFinished(): void {
    this.finishedTime = new Date().getTime();
  }

  /**
   * This should generally be random enough to handle a couple order ids
   * This isn't a permenant solution; it works well enough for me
   * Found on Github: https://gist.github.com/gordonbrander/2230317
   */
  private generateId(): string {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  public setStatus(status: string): void {
    this.setLastModified();
    this.status = status;
  }

  public setStage(stage: string): void {
    this.setLastModified();
    this.stage = stage;
  }

  public setModelID(type: number): void {
    this.setLastModified();
    this.modelID = type;
    this.customOrderInfo = null;
  }

  public setCustomOrder(desc: string, image: OrderImage)
  {
    this.setLastModified();
    this.customOrderInfo = new CustomOrderInfo(desc, image);
  }

  // Allows me to easily convert the object and store it into the mongoDB database
  public async toJSON(): Promise<object> {
    let jsonObj = {
      "_id": this._id,
      "pin": this.pin,
      "createDate": this.createDate,
      "lastModified": this.lastModified,
      "finishedTime": this.finishedTime,
      "status": this.status,
      "stage": this.stage,
      "modelID": this.modelID,
      "isCustomOrder": (!!this.customOrderInfo),
      "orderDesc": (this.customOrderInfo ? this.customOrderInfo.orderDesc : null),
      "imageData": (this.customOrderInfo ? await this.customOrderInfo.orderImage.toBuffer() : null),
      "manufacturerReq": this.manufacturerReq,
      "supplyOrders": this.supplyOrders,
      "colors": this.colors,
      "assembledModel": this.assembledModel
    };

    return jsonObj;
  }
}