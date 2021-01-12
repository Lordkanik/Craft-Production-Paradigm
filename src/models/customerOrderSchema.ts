import {IOrder, OrderSchema} from "./orderBaseSchema";

export interface ICustomerOrder extends IOrder
{
    stage: string;
    modelID: number;
    isCustomOrder: boolean;
    orderDesc: string;
    imageData: Buffer;
    assembledModel: string;
}

export const CustomerOrderSchema = OrderSchema.clone();
CustomerOrderSchema.add({
    stage: {type: String, default: 'Manufacturer'},
    modelID: {type: Number, default: -1},
    isCustomOrder: {type: Boolean, default: false},
    orderDesc: {type: String, default: null},
    imageData: {type: Buffer, default: null},
    assembledModel: {type: String, default: null},
});