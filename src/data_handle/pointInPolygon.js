/**
 * Created by Burgess on 2017/3/5.
 */
import fs from 'fs'
import Weibo from '../server/api/controller/Weibo'

export default class PointInPolygon {
    readJsonData(filename, callback){
        fs.readFile(filename, function (err, data) {
            if (err) throw  err;
            let json = JSON.parse(data);
            callback(json);
        });
    }

    //射线法
    pointInPolygon(target , points){
        let length = points.length, tx = target[0], ty = target[1];
        let isOdd = false; //当结果为奇数时为在多边形内
        //预处理最后一个点
        if (tx === points[length - 1][0] && ty === points[length - 1][1]) return true;

        for(let i = 0, j = length - 1; i < length; j = i, ++i){
            let x1 = points[i][0],
                px2 = points[j][0], //前一个点
                y1 = points[i][1],
                py2 = points[j][1], x;
            //点在顶点上
            if (tx === x1 && ty == y1) return true;

            //点在线段两边, 认定射线经过的点均在射线上方
            if ((ty  < y1 && ty >= py2) || (ty >= y1 && ty < py2)) {
                    //线段上与射线 Y 坐标相同的点的 X 坐标
                    x = x1 + (ty - y1) * (px2 - x1) / (py2 - y1)

                    // 点在多边形的边上
                    if(x === tx) {
                        return true;
                    }

                    // 射线穿过多边形的边界
                    if(x < tx) {
                        isOdd = !isOdd
                    }
            }
        }
        return isOdd;
    }
}

//
// let test = new PointInPolygon(), weibo = new Weibo();
// test.readJsonData(`public/china/geometryCouties/430100.json`, (json)=>{
//    let features = json.features, provinceId, areaId, placeId, points ,result;
//
//     for(let i = 0; i < features.length; ++i){
//         console.log(features[i].properties.name)
//         switch(features[i].geometry.type){
//             case 'Polygon' :
//                 points = features[i].geometry.coordinates[0];
//                 result = test.pointInPolygon([112.990791, 28.255104], points);
//                 break;
//             case 'MultiPolygon' :
//                 let pointsParent = features[i].geometry.coordinates[0];
//                 for (let j = 0; j < pointsParent.length; ++j){
//                     points = pointsParent[j];
//                     result = test.pointInPolygon([112.990791, 28.255104], points);
//                 }
//                 break;
//         }
//
//         if (result){
//             provinceId = features[i].properties.id;
//             break;
//         }
//     }
//     console.log(provinceId);
// });

// weibo.findInfo({}, (data)=>{
//     console.log(data);
//     data.geo.coordinates
// });

// function readDirectory(dirPath) {
//     if (fs.existsSync(dirPath)) {
//         var files = fs.readdirSync(dirPath);
//
//         files.forEach(function(file) {
//             var filePath = dirPath + "/" + file;
//             var stats = fs.statSync(filePath);
//
//             if (stats.isDirectory()) {
//                 console.log('\n读取目录：\n', filePath, "\n");
//                 readDirectory(filePath);
//             } else if (stats.isFile()) {
//                 var buff = fs.readFileSync(filePath);
//                 if (buff[0].toString(16).toLowerCase() == "ef" && buff[1].toString(16).toLowerCase() == "bb" && buff[2].toString(16).toLowerCase() == "bf") {
//                     //EF BB BF 239 187 191
//                     console.log('发现BOM文件：', filePath, "\n");
//
//                     buff = buff.slice(3);
//                     fs.writeFileSync(filePath, buff.toString(), "utf8");
//                 }
//             }
//         });
//
//     } else {
//         console.log('Not Found Path : ', dirPath);
//     }
// }
//
// readDirectory(`public/china/geometryCouties`);