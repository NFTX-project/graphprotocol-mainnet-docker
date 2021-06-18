import express, { Router } from 'express';
import POIController from '../controllers/POIController';

const router = Router();
const poiController = new POIController();

router.get('/poi', poiController.list);
router.get('/poi/:subgraph/:block', poiController.get);

export default router;
