/**
 * This controller handles the game and setup
 */

import * as mongoose from 'mongoose';
import {GameScheme, getTypeInfoByName, IGame, PositionInfo} from '../models/gameSchema';
import {Request, Response} from 'express';
import {GameDatabaseConnector} from '../models/GameDatabaseConnector';
import DatabaseConnector from "../models/database";
import {PartInventory} from "../models/partInventory";

const Game: mongoose.Model<any> = mongoose.model('Game', GameScheme);

export class GameController {
  private db: GameDatabaseConnector;
  constructor(dbClient: DatabaseConnector) {
    this.db = new GameDatabaseConnector(dbClient);
  }

  /**
   * Takes data sent and creates database entry
   * @param req 
   */
  public async addNewGame(req: Request): Promise<number> {
    let requestGame: IGame = req.body;
    requestGame.pin = await this.generatePin();
    requestGame.maxPlayers = Object.keys(getTypeInfoByName(requestGame.gameType).positions).length;
    let game = new Game(requestGame);
    this.db.addToDatabase(game);
    return requestGame.pin;
  }

  public joinGame(pin: number, positionName: string, playerName: string) {
    this.db.joinGame(pin, {positionName: positionName, playerName: playerName});
  }

  /**
   * Gets all of the game info from database using the pin
   * @param pin JavaScript decided for me that it will be a string
   */
  public async getGameInfo(pin: number): Promise<IGame | null> {
    return await this.db.getGameObject(pin);
  }

  public addActivePlayer(pin: number): void {
    this.db.addActivePlayer(pin);
  }

  public removeActivePlayer(pin: number, position: string): void {
    this.db.removeActivePlayer(pin, position);
  }

  public async getPlayerName(pin: number, position: string): Promise<string> {
    return this.db.getPlayerName(pin, position);
  }

  public async checkIfPinExists(pin: number) {
    return await this.db.checkIfPinExists(pin);
  }

  public async getPossiblePositions(pin: number): Promise<Array<string>> {
    return this.db.getPossiblePositions(pin);
  }

  public async getAssemblerParts(pin: number): Promise<Array<PartInventory> | null>
  {
    return this.db.getAssemblerParts(pin);
  }

  public async setAssemblerParts(pin: number, newParts: Array<PartInventory>): Promise<void>
  {
    return this.db.setAssemblerParts(pin, newParts);
  }

  public async addAssemblerParts(pin: number, newParts: Array<PartInventory>): Promise<void>
  {
    let assemblerParts: (Array<PartInventory> | null) = await this.db.getAssemblerParts(pin);

    if(assemblerParts)
    {
      newParts.forEach(thisNewPart => {
        // Checked twice because TypeScript won't change the data type if a null check occurs in an outer block
        if(assemblerParts)
        {
          let matchedExistingIndex: number = assemblerParts.findIndex(function (thisExistingPart): boolean {
            return (thisExistingPart.partID === thisNewPart.partID && thisExistingPart.color === thisNewPart.color);
          });

          if (matchedExistingIndex !== -1)
          {
            assemblerParts[matchedExistingIndex].count += thisNewPart.count;
          }
          else
          {
            assemblerParts.push(thisNewPart);
          }
        }
      });

      await this.db.setAssemblerParts(pin, assemblerParts);
    }
    else
    {
      await this.db.setAssemblerParts(pin, newParts);
    }
  }

  /**
   * Generates a pin and makes sure the pin doesn't already exist in the db
   */
  private async generatePin(): Promise<number> {    
    let notOriginal: Boolean = true;
    let pin: number = Math.floor(Math.random() * 9999);

    while(notOriginal) {
      let result = await this.db.checkIfPinExists(pin);
      notOriginal = result;
      if (notOriginal) pin = Math.floor(Math.random() * 9999);
    }

    return pin;
  }
}