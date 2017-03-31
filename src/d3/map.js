/**
 * Created by Burgess
 */

import React, { Component } from 'react';
import L from 'leaflet'
import * as d3 from 'd3'
import 'whatwg-fetch'
import {connect} from 'react-redux'

let proxy = "http://localhost:3001";

class Map extends Component {
    constructor(props){
        super(props);
        let common = props.common;
        this.selectedProvince = common.selectedProvince;
        this.selectedCity = common.selectedCity;
        this.currentMapLevel = common.currentMapLevel; //0 为国家，1为省，2为市

        this.map = {};
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

        //dataStore
        this.provinceStore = {};
        this.cityStore = {};
        this.areaStore = {};
        this.grades = [0, 200, 500, 1000, 2000, 5000, 10000, 20000];

        //layer
        this.currentLayout = {};
        this.infoPanel = L.control();
        this.legendPanel = L.control({position: 'bottomright'});
        //bind function
        this._addZoomListener.bind(this);
        this._featureMouseOver.bind(this);
        this._onEachFeature.bind(this);
        this._featureMouseOut.bind(this);
        this._featureClick.bind(this);
    }

    componentDidMount(){
        this.init();
    }

    componentDidUpdate(){
        console.log(this.props);
    }

    init(){
        this.map = L.map('mapid',{
            maxZoom: 13,
            minZoom: 4,
        }).setView([31.27091, 121.40081], 4);
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            id: 'mapbox.dark'
        }).addTo(this.map);

        this.readGeoJson('./china/china.json');
        let southWest = L.latLng(25, 70),
            northEast = L.latLng(50, 138),
            bounds = L.latLngBounds(southWest, northEast);
        this.map.setMaxBounds(bounds);
        this.addInfoPanel();
        this.addLegend();
        this._addZoomListener();
        // let url = proxy;
        // url += '/province/pos/31';
        // fetch(url)
        //     .then((response)=>{
        //         return response.json()
        //     }).then((json)=>{
        //     for(let i = 0; i < 1000; ++i){
        //         let item = json[i];
        //         L.circle([item.geo.coordinates[1], item.geo.coordinates[0]], {
        //             color: 'red',
        //             fillColor: 'white',
        //             fillOpacity: 0.5,
        //             radius: 5
        //         }).addTo(this.map)
        //     }
        //     var svg = d3.select('svg');
        //     svg.select('.pos')
        //         .data(json.map((item)=>{
        //             return item.geo.coordinates;
        //         }))
        //         .enter()
        //         .append('rect')
        //         .attr('class', 'Rect')
        //         .attr('fill', 'deepskyblue')
        //         .attr('x', function (d, i) {
        //             return d[0];
        //         })
        //         .attr('width', 5)
        //         .attr('y', function (d, i) {
        //             return d[1];
        //         })
        //         .attr('height', 5);
        //
        // })
    }

    addInfoPanel() {
        let _this = this;
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

    //进入下一层
    _featureClick(e) {
        if (this.first) this.first = false;
        let target = e.target;
        if (this.currentMapLevel === 0){
            this.selectedProvince = target.feature.properties.id;
        }
        else if(this.currentMapLevel === 1){
            this.selectedCity = target.feature.properties.id;
        }
        //如果是china的层次,则进入下一层
        if(this.currentMapLevel === 0){
            console.log('change to province : ' + this.selectedProvince);
            this.currentMapLevel = 1;
            this.map.removeLayer(this.currentLayout);
            this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
        }//如果是province层次，且继续放大，则进入下一层
        else if (this.currentMapLevel === 1){
            console.log('change to area : ' + this.selectedCity);
            this.currentMapLevel = 2;
            this.map.removeLayer(this.currentLayout);
            this.readGeoJson(`./china/geometryCouties/${this.selectedCity.substr(0,4)}00.json`);
        }
        this.map.fitBounds(target.getBounds());
        if (this.map.getZoom() < 8){this.map.setZoom(9);}
    }

    readGeoJson(fileName, callBack){
        d3.json(fileName, (error, collection) => {
            if (error) throw error;
            if (callBack) callBack(collection);
            else this.handleGeoJson(collection);
        });
    }

    handleGeoJson(collection) {
        let _this = this, item = this.getDetailData(), tmpJson;
        //如果数据存在，无需查询
        if (Map.isEmptyObject(item)){
            //dataUrl
            let url = proxy;
            if (this.currentMapLevel === 0){
                url += '/china';
            }else if (this.currentMapLevel === 1){
                url += `/province/${this.selectedProvince}`
            }else{
                url += `/city/${this.selectedCity}`
            }
            console.log(url);
            fetch(url)
                .then( (response) => {
                    return response.json();
                }).then((json)=>{
                tmpJson = Map.handleJsonArrayToObject(json);
                //存入props
                this.props.updateDataStore(tmpJson, this.currentMapLevel);
                //存入数据仓库
                if (this.currentMapLevel === 0){
                    _this.provinceStore = tmpJson;
                }else if (this.currentMapLevel === 1){
                    this.props.changeToProvince(this.selectedProvince);
                    _this.cityStore[_this.selectedProvince] = tmpJson;
                }else{
                    this.props.changeToCity(this.selectedCity);
                    _this.areaStore[_this.selectedCity] = tmpJson;
                }
                this.infoPanel.update();
                this.currentLayout = L.geoJson(collection, {
                    style: _this._style.bind(_this),
                    onEachFeature: _this._onEachFeature.bind(_this)
                });
                this.currentLayout.addTo(this.map);
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            });
        }else {//数据已存在
            if (this.currentMapLevel === 1){
                this.props.changeToProvince(this.selectedProvince);
            }else if (this.currentMapLevel === 2){
                this.props.changeToCity(this.selectedCity);
            }
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
                console.log(`change from area ${this.selectedCity} to province : ${this.selectedProvince}`);
                this.currentMapLevel = 1; this.selectedCity = -1;
                this.props.changeToProvince(this.selectedProvince, true);
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
            }
            else if(e.target.getZoom() < 5 && this.currentMapLevel === 1){
                console.log(`change from ${this.selectedProvince} to china`);
                this.currentMapLevel = 0; this.selectedProvince = -1;
                this.props.changeToChina();
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/china.json`);
            }
        })
    }

    _featureMouseOver(e) {
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

    _featureMouseOut(e) {
        this.currentLayout.resetStyle(e.target);
        this.infoPanel.update();
    }

    _onEachFeature(feature, layer) {
        let _this = this;
        layer.on({
            mouseover: _this._featureMouseOver.bind(_this),
            mouseout: _this._featureMouseOut.bind(_this),
            click: _this._featureClick.bind(_this)
        });
    }

    _style(feature) {
        let _this = this;
        return {
            fillColor: _this.getColor(feature),
            weight: 1,
            opacity: 0.5,
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

    getDataStore(){
        switch (this.currentMapLevel){
            case 0 : return this.provinceStore;
            case 1 : return this.cityStore;
            case 2 : return this.areaStore;
            default : return {};
        }
    }

    getDetailData(){
        let dataJson = this.getDataStore();
        return this.currentMapLevel === 0 ? dataJson : (this.currentMapLevel === 1 ? dataJson[this.selectedProvince] : dataJson[this.selectedCity]);
    }

    static isEmptyObject(obj){
        for (let i in obj)
            return false;
        return true;
    }

    static handleJsonArrayToObject(json){
        let obj = {};
        for (let item of json){
            obj[item._id] = item;
        }
        return obj
    }

    render(){
        return <div id="mapid"></div>;
    }
}

let mapStateToProps = (state)=>{
    return {
        common : {
            selectedProvince : state.common.selectedProvince || -1,
            selectedCity : state.common.selectedCity || -1,
            currentMapLevel : state.common.currentMapLevel || 0, //0 为国家，1为省，2为市
            dataStore: state.common.dataStore || {}
        }
    }
};

let mapDispatchToProps = (dispatch)=>{
    return {
        changeToProvince : (id, remove = false) => dispatch({type: "changeToProvince", payload: {id: id, removeId: remove}}),
        changeToCity : (id, remove = false) => dispatch({type: "changeToCity", payload: {id: id, removeId: remove}}),
        changeToChina : () => dispatch({type: "changeToChina"}),

        updateDataStore : (json, level) => dispatch({type: "updateDataStore", payload:{data: json, level: level}})
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Map);