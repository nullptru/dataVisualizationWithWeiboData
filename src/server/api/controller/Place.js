/**
 * Created by Burgess on 2017/3/7.
 */

import mongoose from 'mongoose';
import config from 'config'

import Province from '../model/Province'
import City from '../model/City'
import Area from '../model/Area'

export default class Place {
    constructor(){
        this.provinceInfo = new Province().getModel();
        this.areaInfo = new Area().getModel();
        this.cityInfo = new City().getModel();
    }

    findProvince(search, filter ,callback){
        this.provinceInfo.find(search,filter, (err, data)=>{
                if (err) throw err;
                callback(data);
            });
    }

    findCity(search, callback){
        this.cityInfo.find(search,(err, data)=>{
            if (err) throw err;
            callback(data);
        });
    }

    findArea(search, callback){
        this.areaInfo.find(search,(err, data)=>{
            if (err) throw err;
            callback(data);
        });
    }
}