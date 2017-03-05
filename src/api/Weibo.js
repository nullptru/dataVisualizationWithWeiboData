/**
 * Created by Burgess on 2017/3/1.
 */
import mongoose from 'mongoose';
import config from 'config'

import WeiboInfo from '../middlewares/db/WeiboInfo'

export default class Weibo {
    constructor(){
        this.config = config.get("dbConfig");
        mongoose.connect(`mongodb://${this.config.host}/${this.config.database}`);
        mongoose.Promise = Promise;
        this.Info = new WeiboInfo().getModel();

    }

    insertInfo(json, callback){
        let insertJson = new this.Info(json);
        insertJson.save(function (err, doc) {
            callback(err, doc);
        });
    }
}