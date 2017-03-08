/**
 * Created by Burgess on 2017/3/7.
 */
import mongoose from 'mongoose';

export default class Province {
    constructor(){
        let Schema = mongoose.Schema;
        this.json = new Schema({
            id : String,
            name : String
        });
    }

    getModel(){
        return mongoose.model('province', this.json);
    }
}