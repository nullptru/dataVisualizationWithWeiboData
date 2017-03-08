/**
 * Created by Burgess on 2017/3/7.
 */
import mongoose from 'mongoose';
import config from 'config'

class InfoJson {
    constructor(){
        let Schema = mongoose.Schema;
        this.json = new Schema({
            id : String,
            name : String
        });
    }

    getModel(){
        return mongoose.model('area', this.json);
    }
}
class jsonData {
    constructor(){
        this.config = config.get('dbConfig');
        mongoose.connect(`mongodb://${this.config.host}/${this.config.database}`);
        mongoose.Promise = Promise;
        this.info = new InfoJson().getModel();
    }

    insertInfo(json){
        let insertJson = new this.info(json);
        insertJson.save(function (err, doc) {
            if (err) throw err;
        })
    }
}
// let insert = new jsonData();
// for(let key in city_object) {
//     insert.insertInfo(city_object[key]);
// }