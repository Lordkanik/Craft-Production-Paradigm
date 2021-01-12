import { Router, Request, Response } from 'express';
import multer = require('multer');

import {GameLogicController} from '../controllers/GameLogicController'
import * as cors from 'cors';
import {PartInventory} from "../models/partInventory";
import {GameController} from "../controllers/GameController";
import {text as textParser} from "body-parser";

export function createRoutes(gameController: GameController, gameLogicController: GameLogicController): Router {
  const router: Router = Router();
  let fileUpload = multer();

  router.post('/sendOrder', fileUpload.single('custom-order-image'), async (req: Request, res: Response) => {
    let pin: number = parseInt(req.body.pin);

    if (req.body.model) {
      let modelID: number = parseInt(req.body.model);
      await gameLogicController.placeOrder(pin, modelID);
    } else {
      let modelDesc: string = req.body['custom-order-desc'];
      let modelImageData: Express.Multer.File = req.file;

      await gameLogicController.placeCustomOrder(pin, modelDesc, modelImageData.buffer);
    }

    res.status(200).send('OK');
  });

  router.get('/getOrder/:id/:orderID', async (req: Request, res: Response) => {
    res.send(await gameLogicController.getOrder(parseInt(req.params.id), req.params.orderID));
  });

  router.get('/getCustomOrderImage/:id/:orderID', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'image/png');
    res.send(await gameLogicController.getCustomOrderImage(parseInt(req.params.id), req.params.orderID));
  });

  router.get('/getOrders/:id', async (req: Request, res: Response) => {
    res.send(await gameLogicController.getOrders(parseInt(req.params.id)));
  });

  router.post('/sendSupplyOrder/:id/:orderID', async (req: Request, res: Response) => {
    await gameLogicController.completeSupplyOrder(parseInt(req.params.id), req.params.orderID, (req.body.order as Array<PartInventory>));
    res.status(200).send('OK');
  });

  router.get('/getAssemblerParts/:id', async (req: Request, res: Response) => {
    res.send(await gameController.getAssemblerParts(parseInt(req.params.id)));
  });

/*  router.get('/getSupplyOrder/:id/:orderId', async (req: Request, res: Response) => {
    res.send(await controller.getSupplyOrder(parseInt(req.params.id), req.params.orderId));
  });*/

  /*router.get('/colors/:id/:orderId', async (req: Request, res: Response) => {
    let result = await controller.getColors(parseInt(req.params.id), req.params.orderId);
    res.send(result);
  });*/

  router.post('/forwardManufacturerOrder/:id/:orderID', async (req: Request, res: Response) => {
    res.send(await gameLogicController.forwardManufacturerOrder(parseInt(req.params.id), req.params.orderID));
  });

  router.post('/setAssemblerParts/:id', textParser(), async (req: Request, res: Response) => {
    if(req.body.pieces !== undefined) {
      res.send(await gameController.setAssemblerParts(parseInt(req.params.id), req.body.pieces));
    }
    else
    {
      res.send(await gameController.setAssemblerParts(parseInt(req.params.id), JSON.parse(req.body).pieces));
    }
  });

  router.post('/sendAssembledModel/:id/:orderId', (req: Request, res: Response) => {
    console.log('Assembled model has been sent');
    res.send(gameLogicController.updateAssembledModel(parseInt(req.params.id), req.params.orderId, req.body.model));
  });

  router.get('/getAssembledModel/:id/:orderId', async (req: Request, res: Response) => {
    res.send(await gameLogicController.getAssembledModel(parseInt(req.params.id), req.params.orderId));
  });

/*  router.get('/getManufacturerRequest/:id/:orderId', async (req: Request, res: Response) => {
    res.send(await controller.getManufacturerRequest(parseInt(parseInt(req.params.id)), req.params.orderId));
  });*/

  router.post('/addSupplyOrder/:id', (req: Request, res: Response) => {
    res.send(gameLogicController.addSupplyOrder(parseInt(req.params.id), (req.body.request as Array<PartInventory>)));
  });

  router.get('/getSupplyOrders/:id', async (req: Request, res: Response) => {
    res.send(await gameLogicController.getSupplyOrders(parseInt(req.params.id)));
  });

  router.post('/acceptOrder/:id/:orderId', (req: Request, res: Response) => {
    res.send(gameLogicController.acceptOrder(parseInt(req.params.id), req.params.orderId));
  });

  router.post('/rejectOrder/:id/:orderId', (req: Request, res: Response) => {
    res.send(gameLogicController.rejectOrder(parseInt(req.params.id), req.params.orderId));
  });

  return router;
}