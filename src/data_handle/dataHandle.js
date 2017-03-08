import readline from 'readline';
import fs from 'fs';

import Weibo from '../server/api/controller/Weibo'
import PointInPoly from '../data_handle/pointInPolygon'

export default class dataHandle {
    constructor(){
        this.pointInPoly = new PointInPoly();
        this.lineCount = 0;
        this.pattern = new RegExp(/{.*}/);
        this.dataJsonTemplate = {
            uid : '',
            mid : '',
            created_time : '',
            source : '',
            text : '',
            geo:{},
            provinceId:'',
            cityId:'',
            areaId:''
        }
    }

    init(filename){
        this.rl = readline.createInterface({
            input : fs.createReadStream(filename)
        });

        this.rl.on('close', ()=>{
            console.log('readline close...total: ' + this.lineCount);
        });
    }

    readJSONData(callback){
        this.rl.on('line', (line)=>{
            let jsonData = JSON.parse(line.match(this.pattern));
            callback(jsonData);
        })
    }

    formatInsertData(json){
        let insertJson = Object.create(this.dataJsonTemplate);
        insertJson.uid = json.uid;
        insertJson.mid = json.mid;
        insertJson.created_time = json.created_at;
        insertJson.source = json.source.match(new RegExp(/<a.*>(.*)<\/a>/))[1];
        insertJson.text = json.text;
        insertJson.geo = json.geo;
        insertJson.provinceId = json.provinceId;
        insertJson.cityId = json.cityId;
        insertJson.areaId = json.areaId;

        return insertJson;
    }

    getGeoId(features, point){
        let points, result, id = -1;
        for(let i = 0; i < features.length; ++i){
            switch(features[i].geometry.type){
                case 'Polygon' :
                    points = features[i].geometry.coordinates[0];
                    result = this.pointInPoly.pointInPolygon(point, points);
                    break;
                case 'MultiPolygon':
                    let pointsParent = features[i].geometry.coordinates[0];
                    for (let j = 0; j < pointsParent.length; ++j){
                        points = pointsParent[j];
                        result = this.pointInPoly.pointInPolygon(point, points);
                        if (result) break;
                    }
                    break;
            }
            if (result){
                id = features[i].properties.id;
                break;
            }
        }
        return id;
    }
    injectGeoData(point, inJson, callback){
        try{
            this.pointInPoly.readJsonData(`public/china/china.json`, (json)=>{
                let features = json.features, provinceId = -1, cityId = -1, areaId = -1;

                provinceId = this.getGeoId(features, point);
                if (provinceId === -1) {
                    callback(true, {});
                    return;
                }
                this.pointInPoly.readJsonData(`public/china/geometryProvince/${provinceId}.json`, (json)=>{
                    features = json.features;
                    cityId = this.getGeoId(features, point);
                    let areaStr = cityId.toString().substr(0,4);

                    if (cityId.toString().length <= 4) {
                        if (fs.existsSync(`public/china/geometryCouties/${areaStr}00.json`)) {
                            this.pointInPoly.readJsonData(`public/china/geometryCouties/${areaStr}00.json`, (json) => {
                                features = json.features;
                                areaId = this.getGeoId(features, point);
                                if (areaId == -1) {
                                    callback(true, {});
                                    return;
                                }
                                //console.log('enter' + provinceId + '   ' + cityId + '   ' + areaId);
                                inJson.provinceId = provinceId;
                                inJson.cityId = cityId;
                                inJson.areaId = areaId;
                                callback(false, inJson);
                            });
                        }
                    }else {
                        areaId = cityId;
                        inJson.provinceId = provinceId;
                        inJson.cityId = cityId;
                        inJson.areaId = areaId;
                        callback(false, inJson)
                    }
                });
            });
        }catch (err){
            callback(true, {});
        }
    }
}

let handle = new dataHandle(), weibo = new Weibo();
handle.init('data');
handle.readJSONData((json)=>{
    try{
        if (json != null) {
            let tmp = [json.geo.coordinates[1], json.geo.coordinates[0]];
            json.geo.coordinates = tmp;
            handle.injectGeoData(json.geo.coordinates, json, (isError, json) => {
                if (isError) return;
                weibo.insertInfo(handle.formatInsertData(json), function (err, doc) {
                    //console.log(handle.lineCount);
                    handle.lineCount++;
                });
            });
        }
    }catch (err){
        console.error(err);
    }

});