/**
 * Created by Burgess on 2017/3/2.
 */
import mongoose from 'mongoose';

export default class WeiboInfo {
    constructor(){
        let Schema = mongoose.Schema;
        this.WeiboInfo = new Schema({
            uid : Number,
            mid : String,
            created_time : Date,
            source : String,
            text : String,
            geo: Object,
            provinceId : Number,
            areaId : Number,
            cityId : Number
        });
    }

    getModel(){
        return mongoose.model('BaseInfo', this.WeiboInfo);
    }
}