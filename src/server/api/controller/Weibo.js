/**
 * Created by Burgess on 2017/3/1.
 */
import mongoose from 'mongoose';
import config from 'config'

import WeiboInfo from '../model/WeiboInfo'

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
            if (err) throw err;
            callback(doc);
        });
    }

    updateInfo(search, update, callback){
        this.Info.update(search, update, (err, row)=>{
            if (err) throw err;
            callback(row);
        });
    }

    findInfo(search, callback){
        this.Info.find(search)
            .limit(10)
            .exec((err, data)=>{
                if (err) throw err;
                callback(data);
            });
    }

    findCountByProvince(callback){
        this.Info.aggregate({$group :
            {
                _id : "$provinceId",
                count : {$sum : 1}
            }}, function (err, res) {
                if (err) throw err;
            callback(res);
        });

    }

    findCountByCity(search, callback){
        let query;
        if (search){
            query = [{
                $match: {
                    provinceId : Number.parseInt(search)
                }},
                {$group :
                {
                    _id : "$cityId",
                    count : {$sum : 1}
                }
            }
            ]
        }else {
            query = [{$group :
                {
                    _id : "$cityId",
                    count : {$sum : 1}
                }
            }
            ]
        }
        this.Info.aggregate(query, function (err, res) {
            if (err) throw err;
            callback(res);
        });

    }

    findCountByArea(search, callback){
        let query;
        if (search){
            query = [ {
                $match: {
                    cityId : Number.parseInt(search)
                }},
                {$group :
                    {
                        _id : "$areaId",
                        count : {$sum : 1}
                    }
                }
            ]
        }else {
            query = [{$group :
                {
                    _id : "$areaId",
                    count : {$sum : 1}
                }
            }
            ]
        }
        this.Info.aggregate(query, function (err, res) {
            if (err) throw err;
            callback(res);
        });

    }

    findByUser(uid, callback){
        let query = {
            $match : {
                uid : Number.parseInt(uid)
            }
        };
        this.Info.aggregate(query, function (err, res) {
            if (err) throw err;
            callback(res);
        })
    }

    findByDate(time, callback){
        let query = {
            $match : {
                created_time : time
            }
        };
        this.Info.aggregate(query, function (err, res) {
            if (err) throw err;
            callback(res);
        })
    }
}

// let WeiboTest  = new Weibo();
// WeiboTest.findCountByProvince();
// WeiboTest.findCountByCity(37);
// WeiboTest.findCountByArea(37);
