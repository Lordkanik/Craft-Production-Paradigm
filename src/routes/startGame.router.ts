import { Router, Request, Response } from 'express';
import {GameController} from '../controllers/GameController'
import * as cors from 'cors';

export function createRoutes(controller: GameController): Router {
  const router: Router = Router();

  router.post('/', cors(), async (req: Request, res: Response) => {
    let result: any = {"pin": 0};
    result.pin = await controller.addNewGame(req);
    res.send(result);
  });

  router.post('/joinGame/:id', (req: Request, res: Response) => {
    controller.joinGame(parseInt(req.params.id), req.body.positionName, req.body.playerName);
    res.status(200).send('OK');
  });

  router.get('/getGameInfo/:id', cors(), async (req: Request, res: Response) => {
    res.send(await controller.getGameInfo(parseInt(req.params.id)));
  });

  router.get('/addActivePlayer/:id', cors(), (req: Request, res: Response) => {
    controller.addActivePlayer(parseInt(req.params.id));
    res.sendStatus(200);
  });

  router.get('/removeActivePlayer/:id/:position', cors(), (req: Request, res: Response) => {
    controller.removeActivePlayer(parseInt(req.params.id), req.params.position);
    res.sendStatus(200);
  });

  router.get('/checkIfPinExists/:id', cors(), async (req: Request, res: Response) => {
    res.send(await controller.checkIfPinExists(parseInt(req.params.id)));
  });

  router.get('/getPossiblePositions/:id', cors(), async (req: Request, res: Response) => {
    res.send(await controller.getPossiblePositions(parseInt(req.params.id)));
  });

  return router;

// if I create self-contained functions, I can write them like this
//router.post('/', new GameController().addNewGame);
}