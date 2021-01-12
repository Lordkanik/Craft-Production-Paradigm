import {Schema, Document} from "mongoose";

/**
 * This should generally be random enough to handle a couple order ids
 * This isn't a permenant solution; it works well enough for me
 * Found on Github: https://gist.github.com/gordonbrander/2230317
 */
function generateID(): string {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
}

export interface IOrder extends Document
{
    pin: number;
    createDate: number;
    createdBy: string;
    lastModified: number;
    finishedTime: number;
    status: string;
    setLastModified(): void;
    setFinished(): void;
}

export const OrderSchema = new Schema({
    _id: {type: String, default: generateID},
    pin: {type: Number, default: null},
    createDate: {type: Date, default: Date.now},
    createdBy: {type: String},
    lastModified: {type: Date, default: Date.now},
    finishedTime: {type: Date, default: null},
    status: {type: String, default: 'In Progress'}
});

OrderSchema.methods.setLastModified = function(): void {
    this.lastModified = (new Date().getTime());
};

OrderSchema.methods.setFinished = function(): void {
    this.finishedTime = new Date().getTime();
};