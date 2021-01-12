import {Model} from "mongoose";

import {ISupplierOrder, SupplierOrderSchema} from './supplierOrderSchema';
import DatabaseConnector from "./database";

export function makeCollection(dbConnection: DatabaseConnector): Model<ISupplierOrder> {
    return dbConnection.getConnection().model<ISupplierOrder>('SupplierOrder', SupplierOrderSchema, 'supplierOrders');
}