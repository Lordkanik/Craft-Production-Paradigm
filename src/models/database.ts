import * as mongoose from 'mongoose';
import {makeCollection as makeCustomerOrderCollection} from "./customerOrderCollection";
import {makeCollection as makeSupplierOrderCollection} from "./supplierOrderCollection";
import {makeCollection as makeGameCollection} from "./gameCollection";
import {IGame} from "./gameSchema";
import {ICustomerOrder} from "./customerOrderSchema";
import {ISupplierOrder} from "./supplierOrderSchema";

export default class DatabaseConnector {
  protected db: mongoose.Connection;
  protected gameCollection: mongoose.Model<IGame>;
  protected custOrderCollection: mongoose.Model<ICustomerOrder>;
  protected supplierOrderCollection: mongoose.Model<ISupplierOrder>;
  protected url: string;
  constructor() {
    const RECONNECTION_INTERVAL: number = 10000;

    let userPassStr = (process.env.DB_USER !== undefined) ? (process.env.DB_USER + ':' + process.env.DB_PASS + '@') : '';
    let authDBStr = (process.env.DB_AUTH_DB !== undefined) ? ('/' + process.env.DB_AUTH_DB) : '';


    switch (process.env.DB_TYPE) {
      case 'mongo-custom':
        this.url = process.env.DB_STRING;
        break;
      case 'mongo-srv':
        this.url = 'mongodb+srv://' + userPassStr + process.env.DB_HOST + authDBStr;
        break;
      case 'mongo':
        this.url = 'mongodb://' + userPassStr + process.env.DB_HOST + authDBStr;
        break;
      default:
        this.url = 'mongodb://localhost/local';
        break;
    }
    
    console.log(this.url);
    let connectionObj = this.db = mongoose.createConnection(this.url);
    let connString = this.url;

    this.db.on('error', function(errorInfo) {
      console.log('Database connection error:', errorInfo);
      setTimeout(function() {
        console.log('Attempting reconnection to database...');
        connectionObj.openUri(connString);
      }, RECONNECTION_INTERVAL);
    });

    this.db.once('connected', function callback () {
      console.log('Connected to database');
    });

    this.gameCollection = makeGameCollection(this);
    this.custOrderCollection = makeCustomerOrderCollection(this);
    this.supplierOrderCollection = makeSupplierOrderCollection(this);
  }

  public getConnection(): mongoose.Connection
  {
    return this.db;
  }

  public getGameCollection(): mongoose.Model<IGame>
  {
    return this.gameCollection;
  }

  public getCustOrderCollection(): mongoose.Model<ICustomerOrder>
  {
    return this.custOrderCollection;
  }

  public getSupplierOrderCollection(): mongoose.Model<ISupplierOrder>
  {
    return this.supplierOrderCollection;
  }
}
