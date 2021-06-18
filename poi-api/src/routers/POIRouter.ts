import express, { Router } from 'express';
import POIController from '../controllers/POIController';

const router = Router();
const poiController = new POIController();

router.get('/', poiController.list);
router.post('/', poiController.compare);

export default router;
