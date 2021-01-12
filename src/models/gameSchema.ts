import * as mongoose from 'mongoose';

import {PartInventory, PartInventoryScheme} from "./partInventory";
import {objectValues} from "../polyfill";

import {GameObjects} from "../shared/gameObjects";

const Schema = mongoose.Schema;

// export let GAME_TYPES = {CRAFT_PRODUCTION: 'Craft Production', MASS_PRODUCTION: 'Mass Production'};
export interface IGame extends mongoose.Document
{
  pin: number;
  groupName: string;
  gameType: string;
  status: string;
  maxPlayers: number;
  activePlayers: number;
  positions: Array<PositionInfo>;
  createdDate: Date;
  assemblerParts: Array<PartInventory>;
  getPosition(positionName: string): (PositionInfo | undefined);
  getCustomer(): (PositionInfo | undefined);
  getManufacturer(): (PositionInfo | undefined);
}

export class PositionInfo {
  positionName: string = String();
  playerName: string = String();
}

// export class CraftPositionInfo extends PositionInfo {
//   static POSITION_NAMES = GameObjects.GameTypes.CraftProduction.Positions; // {CUSTOMER: 'Customer', MANUFACTURER: 'Manufacturer', SUPPLIER: 'Supplier', ASSEMBLER: 'Assembler'};
// }
//
// export class MassPositionInfo extends PositionInfo {
//   static POSITION_NAMES = GameObjects.GameTypes.MassProduction.Positions; // {CUSTOMER: 'Customer', MANUFACTURER: 'Manufacturer', SUPPLIER: 'Supplier',
//     // ASSEMBLER_BODY: 'Assembler - Body', ASSEMBLER_WHEEL_AXLE: 'Assembler - Wheel and Axle', ASSEMBLER_INTERIOR: 'Assembler - Interior'};
// }

export function getTypeInfoByName(typeName: string)
{
  let typeKey = Object.keys(GameObjects.GameTypes).find(
      value => GameObjects.GameTypes[value].name === typeName);

  if(typeKey !== undefined)
  {
    return GameObjects.GameTypes[typeKey];
  }
  else
  {
    throw 'Invalid game type.';
  }
}

export function getAllPositions(typeName: string): Array<any>
{
    return objectValues(getTypeInfoByName(typeName).positions);
}

// Use a single schema for now, since only position names differ; creating two schemas would involve creating two
// collections for games, which would involve significant refactoring.

let allPositions = {};
Object.assign(allPositions, GameObjects.GameTypes.CraftProduction.positions);
Object.assign(allPositions, GameObjects.GameTypes.MassProduction.positions);

let maxSchemaPlayers: number = Object.keys(GameObjects.GameTypes).map(
    value => Object.keys(GameObjects.GameTypes[value].positions).length).reduce(
    (previousValue, currentValue) => Math.max(previousValue, currentValue)
);
// console.log(maxSchemaPlayers.toString() + " max players");

export const PositionInfoSchema = new Schema({
  positionName: {type: String, enum: objectValues(allPositions).map(value => value.name)},
  playerName: {type: String}
});

let gameTypeNameArray = Object.keys(GameObjects.GameTypes).map(value => GameObjects.GameTypes[value].name);
export const GameScheme = new Schema({
  pin: {type: Number, min: 0, max: 9999},
  groupName: {type: String},
  gameType: {type: String, enum: gameTypeNameArray},
  status: {type: String},
  maxPlayers: {type: Number, min: 2, max: maxSchemaPlayers},
  activePlayers: {type: Number, min: 0, max: maxSchemaPlayers},
  positions: {type: [PositionInfoSchema], default: new Array<PositionInfo>()},
  createdDate: {
    type: Date,
    default: Date.now
  },
  assemblerParts: {type: PartInventoryScheme, default: new Array<PartInventory>()}
});

GameScheme.methods.getPosition = function(positionName: string): (PositionInfo | undefined)
{
  return this.positions.find((value: PositionInfo) => value.positionName === positionName);
};

GameScheme.methods.getCustomer = function(): (PositionInfo | undefined)
{
  let positionName: string;
  switch(this.gameType)
  {
    case GameObjects.GameTypes.CraftProduction.name:
      positionName = GameObjects.GameTypes.CraftProduction.positions.CUSTOMER.name;
      break;
    default:
      throw 'Customer position not available for this game type.';
  }

  return this.getPosition(positionName);
};

GameScheme.methods.getManufacturer = function(): (PositionInfo | undefined)
{
  let positionName: string;
  switch(this.gameType)
  {
    case GameObjects.GameTypes.CraftProduction.name:
      positionName = GameObjects.GameTypes.CraftProduction.positions.MANUFACTURER.name;
      break;
    case GameObjects.GameTypes.MassProduction.name:
      positionName = GameObjects.GameTypes.MassProduction.positions.MANUFACTURER.name;
      break;
    default:
      throw 'Manufacturer position not available for this game type.';
  }

  return this.getPosition(positionName);
};