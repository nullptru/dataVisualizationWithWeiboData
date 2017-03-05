/**
 * Created by Burgess
 */
class Map{
    constructor(){
        this.map = {};
        this.selectedProvince = -1;
        this.selectedArea = -1;
        this.currentMapLevel = 0;
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

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

    init(){
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
        this.readGeoJson('./china/china.json');
        this.first = true;
    }

    addInfoPanel() {
        this.infoPanel.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        this.infoPanel.update = function (props) {
            this._div.innerHTML = '<h4>China Province</h4>' +  (props ?
                    '<b>' + props.name + '</b><br /> id : ' + props.id + ''
                    : '');
        };

        this.infoPanel.addTo(this.map);
    }

    addLegend() {
        this.legendPanel.onAdd = (map) => {
            let div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                labels = [];

            // loop through our density intervals and generate a label with a colored square for each interval
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + this.color(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
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
        this.map.fitBounds(target.getBounds());
    }

    _highlightFeature(e) {
        let layer = e.target;

        layer.setStyle({
            weight: 5,
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

    handleGeoJson(collection) {
        console.log(this);
        let _this = this;
        this.currentLayout = L.geoJson(collection, {
            style: _this._style.bind(_this),
            onEachFeature: _this._onEachFeature.bind(_this)
        });
        this.currentLayout.addTo(this.map);
    }

    _addZoomListener(){
        this.map.on('zoom', (e)=>{
            //如果是china的层次,则进入下一层
            if(e.target.getZoom() >= 6 && this.currentMapLevel === 0){
                console.log('change to province : ' + this.selectedProvince);
                this.currentMapLevel = 1;
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
            }//如果是province层次，且继续放大，则进入下一层
            else if (e.target.getZoom() >= 8 && this.currentMapLevel === 1){
                console.log('change to area : ' + this.selectedArea);
                this.currentMapLevel = 2;
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/geometryCouties/${this.selectedArea}00.json`);
            }
            else if (e.target.getZoom() > 6 && e.target.getZoom() < 8 && this.currentMapLevel === 2){
                console.log('change to province : ' + this.selectedProvince);
                this.currentMapLevel = 1;
                this.map.removeLayer(this.currentLayout);
                this.readGeoJson(`./china/geometryProvince/${this.selectedProvince}.json`);
            }
            if(e.target.getZoom() < 5){
                console.log('change to china');
                this.currentMapLevel = 0;
                let _this = this;
                console.log(this);
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
            fillColor: _this.color(Math.ceil(Math.random() * 20)),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.5
        };
    }
}


let map = new Map();
map.init();



