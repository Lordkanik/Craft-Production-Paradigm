import {Model} from "mongoose";

import {IGame, GameScheme} from './gameSchema';
import DatabaseConnector from "./database";

export function makeCollection(dbConnection: DatabaseConnector): Model<IGame> {
    return dbConnection.getConnection().model<IGame>('Game', GameScheme, 'games');
}