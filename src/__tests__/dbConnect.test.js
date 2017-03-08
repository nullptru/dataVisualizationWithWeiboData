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
            geo:{}
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

        return insertJson;
    }

    getGeoId(features, point){
        console.log(point);
        let points, result, id;
        for(let i = 0; i < features.length; ++i){
            //console.log(features[i].properties.name);
            switch(features[i].geometry.type){
                case 'Polygon' :
                    points = features[i].geometry.coordinates[0];
                    result = this.pointInPoly.pointInPolygon(point, points);
                    break;
                case 'MultiPolygon' :
                    let pointsParent = features[i].geometry.coordinates[0];
                    for (let j = 0; j < pointsParent.length; ++j){
                        points = pointsParent[j];
                        result = this.pointInPoly.pointInPolygon(point, points);
                    }
                    console.log(result);
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
        this.pointInPoly.readJsonData(`public/china/china.json`, (json)=>{
            let features = json.features, provinceId = -1, areaId = -1, placeId = -1;

            provinceId = this.getGeoId(features, point);
            this.pointInPoly.readJsonData(`public/china/geometryProvince/${provinceId}.json`, (json)=>{
                features = json.features;
                areaId = this.getGeoId(features, point);
                let areaStr = areaId.toString().substr(0,4);

                if (areaId.toString().length < 4) {
                    if (fs.existsSync(`public/china/geometryCouties/${areaStr}00.json`)) {
                        this.pointInPoly.readJsonData(`public/china/geometryCouties/${areaStr}00.json`, (json) => {
                            features = json.features;
                            placeId = this.getGeoId(features, point);
                        })
                    }
                }else {
                    placeId = areaId;
                }
                if (placeId == -1) {
                }
                console.log('enter' + provinceId + '   ' + areaId + '   ' + placeId);
                inJson.geo.geoId = {
                    provinceId: provinceId,
                    areaId: areaId,
                    placeId: placeId
                };
                callback(inJson)

            });
        });
    }
}

let handle = new dataHandle(), weibo = new Weibo();
handle.init('data');
handle.readJSONData((json)=>{
    let tmp = [json.geo.coordinates[1], json.geo.coordinates[0]];
    json.geo.coordinates = tmp;
    handle.injectGeoData(json.geo.coordinates, json, (json)=>{
        weibo.insertInfo(handle.formatInsertData(json), function (err, doc) {
            //console.log(handle.lineCount);
            handle.lineCount++;
        });
    });

});