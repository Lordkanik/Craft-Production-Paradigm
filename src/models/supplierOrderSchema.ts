import {IOrder, OrderSchema} from "./orderBaseSchema";
import {PartInventory, PartInventoryScheme} from "./partInventory";

export interface ISupplierOrder extends IOrder
{
    manufacturerReq: Array<PartInventory>;
    supplyOrders: Array<PartInventory>;
}

export const SupplierOrderSchema = OrderSchema.clone();
SupplierOrderSchema.add({
    manufacturerReq: {type: [PartInventoryScheme], default: new Array<PartInventory>()},
    supplyOrders: {type: [PartInventoryScheme], default: new Array<PartInventory>()}
});