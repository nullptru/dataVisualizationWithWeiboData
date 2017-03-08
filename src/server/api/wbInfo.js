/**
 * Created by Burgess on 2017/2/21.
 */
import express from 'express'
import Weibo from './controller/Weibo'
import Place from './controller/Place'

let router = express.Router();
let weibo  = new Weibo();
//let place  = new Place();

router.get('/china', function (req, res) {
    weibo.findCountByProvince((doc)=>{
        res.json(doc);
    });
});

router.get('/province/:id', function (req, res) {
    weibo.findCountByCity(req.params.id, (doc)=>{
        res.json(doc);
    });
});

router.get('/city/:id', function (req, res) {
    weibo.findCountByArea(req.params.id, (doc)=>{
        res.json(doc);
    });
});

router.get('/uid/:uid', function (req, res) {
    weibo.findByUser(req.params.uid, (doc)=>{
        res.json(doc);
    });
});

router.get('/time/:time', function (req, res) {
    weibo.findByDate(req.params.time, (doc)=>{
        res.json(doc);
    });
});

export default router;