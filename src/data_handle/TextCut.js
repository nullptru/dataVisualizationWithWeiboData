/**
 * Created by Burgess on 2017/3/17.
 */
import nodejieba from 'nodejieba'
var request = require('superagent');
var clusterfck = require("clusterfck");

let proxy = "http://localhost:3001";
let t = ['n','ns', 'nr', 'nd', 'nh' ,'ni', 'nl', 'ns', 'nt', 'nz', 'i', 'j', 'ws'];
let MIN_LEN = 5;
export default class TextCut {
    constructor(){
        this.isInArray = this.isInArray.bind(this);
    }
    getData(){
        let url = proxy, _this = this, vectors = [], tmp;
        url = `http://localhost:3001/province/detail/31`;

        request
            .get(url)
            .end((err, res)=>{
                let json = res.body, len = 2000;//Math.floor(Math.sqrt(json.length));
                console.log(len);
                json.forEach((item)=>{
                    tmp = [0, 0, 0, 0, 0];
                    let arr = this.wordCut(item.text);
                    let min = Math.min(arr.length, MIN_LEN);
                    for(let i = 0; i < min; ++i){
                        tmp[i] = arr[i].weight
                    }
                    vectors.push(tmp);
                });
                console.log(vectors);
                let start = new Date();
                var clusters = clusterfck.kmeans(vectors, len);
                let end = new Date();
                console.log(clusters, end-start);
            });
    }

    isInArray(item){
        let len = t.length;
        for(let i = 0; i < len; ++i)
            if (t[i] === item){
                return true;
            }
        return false;
    }

    wordCut(text){
        let tmpJson = {}, tmpArr = nodejieba.tag(text).filter((word)=>{
            if (this.isInArray(word.tag) && tmpJson[word.word] === undefined){
                tmpJson[word.word] = 1;
                return true;
            }
            return false;
        }).map((word)=>{
            if (nodejieba.extract(word.word, 1)[0] === undefined){
                return {word: word.word, weight: -1}
            }
            return nodejieba.extract(word.word, 1)[0];
        }).sort((a,b)=>{return a.weight < b.weight});
        return tmpArr;
    }
}

let textCut = new TextCut();
textCut.getData();