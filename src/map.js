/**
 * Created by Burgess
 */

import React, { Component } from 'react';
import L from 'leaflet'
import * as d3 from 'd3'
import 'whatwg-fetch'

let proxy = "http://localhost:3001";

export default class Map extends Component {
    constructor(){
        super();
        this.map = {};
        this.selectedProvince = -1;
        this.selectedArea = -1;
        this.currentMapLevel = 0; //0 为国家，1为省，2为市
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

        //dataStore
        this.chinaStore = {};
        this.provinceStore = {};
        this.cityStore = {};
        this.grades = [0, 200, 500, 1000, 2000, 5000, 10000, 20000];

        //layer
        this.currentLayout = {};
        this.infoPanel = L.control();
        this.legendPanel = L.control({position: 'bottomright'});
        //bind function
        this._addZoomListener.bind(this);
        this._highlightFeature.bind(this);
        this._onEachFeature.bind(this);
        this._resetHighlight.bind(this);
        this._zoomToFeature.bind(this);
    }

    componentDidMount(){
        this.init();
    }

    init(){
        this.readGeoJson('./china/china.json');
        this.map = L.map('mapid',{
            maxZoom: 13,
            minZoom: 4,
        }).setView([31.27091, 121.40081], 4);

        let southWest = L.latLng(15, 60),
            northEast = L.latLng(60, 138),
            bounds = L.latLngBounds(southWest, northEast);
        this.map.setMaxBounds(bounds);
        this.addInfoPanel();
        this.addLegend();
        this._addZoomListener();
    }

    addInfoPanel() {
        let _this = this;
        console.log(this.getDataStore(), this.currentMapLevel);
        this.infoPanel.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        this.infoPanel.update =  function(props){
            let dataJson = _this.getDetailData();
            this._div.innerHTML = '<h4>China Province</h4>' +  (props ?
                    '<b>' + props.name + '</b><br /> count : ' +(dataJson[props.id] ? dataJson[props.id].count : 0) + ''
                    : '');
        };

        this.infoPanel.addTo(this.map);
    }

    addLegend() {
        this.legendPanel.onAdd = (map) => {
            let div = L.DomUtil.create('div', 'info legend');

            // loop through our density intervals and generate a label with a colored square for each interval
            for (let i = 0; i < this.grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + this.color(this.grades[i] + 1) + '"></i> ' +
                    this.grades[i] + (this.grades[i + 1] ? '&ndash;' + this.grades[i + 1] + '<br>' : '+');
            }

            return div;
        };

        this.legendPanel.addTo(this.map);
    }

    _zoomToFeature(e) {
        if (this.first) this.first = false;
        let target = e.target;
        if (this.currentMapLevel === 0)
            this.selectedProvince = target.feature.properties.id;
        else if(this.currentMapLevel === 1){
            this.selectedArea = target.feature.properties.id;
        }
        //如果是china的层次,则进入下一层
        if(this.currentMapLevel === 0){
            console.log('change to province : ' + this.selectedProvince);
            this.currentMapLevel = 1;
            this.map.removeLayer(this.currentLayout);
            this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
        }//如果是province层次，且继续放大，则进入下一层
        else if (this.currentMapLevel === 1){
            console.log('change to area : ' + this.selectedArea);
            this.currentMapLevel = 2;
            this.map.removeLayer(this.currentLayout);
            this.readGeoJson(`./china/geometryCouties/${this.selectedArea.substr(0,4)}00.json`);
        }
        this.map.fitBounds(target.getBounds());
        console.log(target ,this.map.getZoom());
        //this.map.setView(target.feature.properties.cp);
        if (this.map.getZoom() < 8){this.map.setZoom(9);}
    }

    _highlightFeature(e) {
        let layer = e.target;

        layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
        this.infoPanel.update(layer.feature.properties);
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    _resetHighlight(e) {
        this.currentLayout.resetStyle(e.target);
        this.infoPanel.update();
    }

    _onEachFeature(feature, layer) {
        let _this = this;
        layer.on({
            mouseover: _this._highlightFeature.bind(_this),
            mouseout: _this._resetHighlight.bind(_this),
            click: _this._zoomToFeature.bind(_this)
        });
    }

    readGeoJson(fileName, callBack){
        d3.json(fileName, (error, collection) => {
            if (error) throw error;
            if (callBack) callBack(collection);
            else this.handleGeoJson(collection);
        });
    }

    handleJsonArrayToObject(json){
        let obj = {};
        for (let item of json){
            obj[item._id] = item;
        }
        return obj
    }

    handleGeoJson(collection) {
        let _this = this, item = this.getDetailData(), tmpJson;
        //如果数据存在，无需查询
        if (this.isEmptyObject(item)){
            //dataUrl
            let url = proxy;
            if (this.currentMapLevel === 0){
                url += '/china';
            }else if (this.currentMapLevel === 1){
                url += `/province/${this.selectedProvince}`
            }else{
                url += `/city/${this.selectedArea}`
            }
            console.log(url);
            fetch(url)
                .then( (response) => {
                    return response.json();
                }).then((json)=>{
                tmpJson = this.handleJsonArrayToObject(json);
                //存入数据仓库
                if (this.currentMapLevel === 0){
                    _this.chinaStore = tmpJson;
                }else if (this.currentMapLevel === 1){
                    _this.provinceStore[_this.selectedProvince] = tmpJson;
                }else{
                    _this.cityStore[_this.selectedArea] = tmpJson;
                }
                this.infoPanel.update();
                this.currentLayout = L.geoJson(collection, {
                    style: _this._style.bind(_this),
                    onEachFeature: _this._onEachFeature.bind(_this)
                });
                this.currentLayout.addTo(this.map);
                //console.log(_this.chinaStore,_this.provinceStore,_this.cityStore);
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            });
        }else {//数据已存在
            this.currentLayout = L.geoJson(collection, {
                style: _this._style.bind(_this),
                onEachFeature: _this._onEachFeature.bind(_this)
            });
            this.currentLayout.addTo(this.map);
        }

    }

    _addZoomListener(){
        this.map.on('zoom', (e)=>{
            if (e.target.getZoom() > 6 && e.target.getZoom() < 8 && this.currentMapLevel === 2){
                console.log(`change from area ${this.selectedArea} to province : ${this.selectedProvince}`);
                this.currentMapLevel = 1;
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
            }
            else if(e.target.getZoom() < 5 && this.currentMapLevel === 1){
                console.log(`change from ${this.selectedProvince} to china`);
                this.currentMapLevel = 0;
                let _this = this;
                //移除监听
                this.currentLayout.off({
                    mouseover: _this._highlightFeature.bind(_this),
                    mouseout: _this._resetHighlight.bind(_this),
                    click: _this._zoomToFeature.bind(_this)
                });
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/china.json`);
            }
        })
    }

    _style(feature) {
        let _this = this;
        return {
            fillColor: _this.getColor(feature),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.5
        };
    }

    getColor(feature){
        let dataJson = this.getDetailData(), i;
        for (let item in dataJson){
            if (dataJson[item]._id == feature.properties.id){
                for (i = 0; i < this.grades.length; i++) {
                    if (this.grades[i] > dataJson[item].count){
                        i--;
                        break;
                    }
                }
            }
        }
        return this.color(i);
    }

    render(){
        return <div id="mapid"></div>;
    }

    getDataStore(){
        switch (this.currentMapLevel){
            case 0 : return this.chinaStore;
            case 1 : return this.provinceStore;
            case 2 : return this.cityStore;
            default : return {};
        }
    }
    
    getDetailData(){
        let dataJson = this.getDataStore();
        return this.currentMapLevel === 0 ? dataJson : (this.currentMapLevel === 1 ? dataJson[this.selectedProvince] : dataJson[this.selectedArea]);
    }

    isEmptyObject(obj){
        for (let i in obj)
            return false;
        return true;
    }
}

