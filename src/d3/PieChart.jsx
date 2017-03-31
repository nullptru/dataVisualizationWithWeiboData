import React, {Component, PropTypes} from 'react'
import {} from 'react-bootstrap/lib'
import * as d3 from 'd3'
import {connect} from 'react-redux'

import '../style/index.css'
import Area from '../jsonData/area'
import City from '../jsonData/city'
import Province from '../jsonData/province'

class PieChart extends Component {
    constructor(props){
        super(props);
        this.state = {
            index: -1,
            mouseTop: -1,
            mouseLeft: -1,
            display: "none",
        }
    }

    generalPieChart(dataSet, dataName){
        d3.select('#pieChartSvg').remove();
        let width = 300, height = 275;
        let svg = d3.select('#pieChart')
            .append('svg')
            .attr('id', 'pieChartSvg')
            .attr('width', width)
            .attr('height', height);

        let pie = d3.pie(),
            innerRadius = 0,
            outerRadius = 110,
            color = d3.scaleOrdinal(d3.schemeCategory10);

        let piedata = pie(dataSet),
            //弧生成器
            arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

        let arcs = svg.selectAll('g')
            .data(piedata)
            .enter()
            .append('g')
            .attr("transform","translate("+ (width/2) +","+ (height/2) +")");

        arcs.append('path')
            .attr('class', 'piePart')
            .attr('fill', function (d,i) {
                return color(i);
            })
            .attr('d', function (d) {
                return arc(d);
            });
        //添加弧内的文字
        arcs.append("text")
            .attr("transform",function(d){
                var x=arc.centroid(d)[0]*1.4;//文字的x坐标
                var y=arc.centroid(d)[1]*1.4;
                return "translate("+x+","+y+")";
            })
            .attr("text-anchor","middle")
            .text(function(d){
                //计算市场份额的百分比
                let percent=Number(d.value)/d3.sum(dataSet)*100;
                //保留一位小数点 末尾加一个百分号返回
                let result = (percent < 5) ? '' : percent.toFixed(1) + '%';
                return result;
            });

        svg.selectAll('.piePart')
            .on('mouseover', (d, i)=>{
                let mousePos = this.mousePosition();
                this.setState({index: i, mouseTop: 0, mouseLeft: 0, display: 'block'});
            });
        svg.on('mouseout', (d, i)=>{
            let poptip = document.getElementById("tip");

            this.setState({index: i, mouseTop: 0, mouseLeft: 0, display: 'none'});
        });
    }

    getDataStore(){
        switch (this.props.currentMapLevel){
            case 0 :
                this.title = "中国各省市分布图";
                return this.props.dataStore.provinceStore;
            case 1 :
                this.title = Province[this.props.selectedProvince].name + "区域分布图";
                return this.props.dataStore.cityStore;
            case 2 :
                this.title = City[this.props.selectedProvince].name + "区域分布图";
                return this.props.dataStore.areaStore;
            default : return {};
        }
    }

    getDataNameStore(){
        switch (this.props.currentMapLevel){
            case 0 : return Province;
            case 1 : return City;
            case 2 : return Area;
            default : return {};
        }
    }

    //获取鼠标位置
    mousePosition(ev){
        ev = ev || window.event;
        if(ev.pageX || ev.pageY){
            return {x:ev.pageX, y:ev.pageY};
        }
        return {
            x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
            y:ev.clientY + document.body.scrollTop - document.body.clientTop
        };
    }

    render() {
        let dataStore = this.getDataStore(), dataSet = [], dataName = [], dataNameStore = this.getDataNameStore();

        for(let item in dataStore){
            dataSet.push(dataStore[item].count);
            dataName.push((dataNameStore[dataStore[item]._id] === undefined) ? '' :dataNameStore[dataStore[item]._id].name);
        }
        this.generalPieChart(dataSet, dataName);
        return(
        <div style={{backgroundColor:'#2e3443', marginRight:'20'}} className="center">
            <h5 style={{margin:'0', paddingTop: '5'}}>{this.title}</h5>
            <div id="pieChart"/>
            <div className="poptip" id="tip" style={{position: "absolute", top: this.state.mouseTop, left: this.state.mouseLeft, display: this.state.display}}>
                {dataName[this.state.index]}
                <div>数据量：{dataSet[this.state.index]}</div>
                <div>百分比：{(Number(dataSet[this.state.index])/d3.sum(dataSet)*100).toFixed(1) + '%'}</div>
            </div>
        </div>);
    }
}

let mapStateToProps = (state)=>{
    return {
            selectedProvince : state.common.selectedProvince || -1,
            selectedCity : state.common.selectedCity || -1,
            currentMapLevel : state.common.currentMapLevel || 0, //0 为国家，1为省，2为市
            dataStore: state.common.dataStore || {}
        }
};

let mapDispatchToProps = (dispatch)=>{
    return {
        getData : () => dispatch({type: "getData"})
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(PieChart);