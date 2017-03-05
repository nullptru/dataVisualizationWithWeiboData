import readline from 'readline';
import fs from 'fs';

import Weibo from '../api/Weibo'

export default class dataHandle {
    constructor(){
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
}

let handle = new dataHandle(), weibo = new Weibo();
handle.init('data');
handle.readJSONData((json)=>{
    weibo.insertInfo(handle.formatInsertData(json), function (err, doc) {
        //console.log(doc);
        handle.lineCount++;
    });
});