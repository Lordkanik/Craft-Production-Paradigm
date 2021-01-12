import {Model} from "mongoose";

import {ICustomerOrder, CustomerOrderSchema} from './customerOrderSchema';
import DatabaseConnector from "./database";

export function makeCollection(dbConnection: DatabaseConnector): Model<ICustomerOrder> {
    return dbConnection.getConnection().model<ICustomerOrder>('CustomerOrder', CustomerOrderSchema, 'customerOrders');
}