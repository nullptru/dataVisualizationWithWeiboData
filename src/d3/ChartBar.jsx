import React, {Component, PropTypes} from 'react'
import {Form, FormControl, FormGroup} from 'react-bootstrap/lib'
import * as d3 from 'd3'
import {connect} from 'react-redux'

let proxy = "http://localhost:3001";
class ChartBar extends Component {
    constructor(props){
        super(props);
        this.state = {
            dataMap : [],
            dataCount : [],
            select : [],
            filter: 2013
        };
        //dataStore
        this.provinceStore = {};
        this.cityStore = {};
        this.areaStore = {};
    }

    componentDidMount(){
        let dataPromise = this.fetchData();
        dataPromise.then((data)=>{
            let dataMap = data, t = {}, select = [];
            dataMap.forEach((item)=>{
                if (t[item.year] === undefined){
                    t[item.year] = 1;
                    select.push(item.year);
                }
            });
            this.setState({
                dataMap : dataMap,
                select: select,
                filter: select[0]
            }, ()=>{
                this.dataFilter(data);
            });

        })
    }

    dataFilter(){
        let dataMap = this.state.dataMap;
        let dataFilter = dataMap.filter((item)=>{
            return item.year.toString() === this.state.filter.toString();
        });
        let dataCount = [0,0,0,0,0,0,0,0,0,0,0,0];
        dataFilter.forEach((item)=>{
            dataCount[item.month - 1] = item.count;
        });
        this.setState({
            dataCount: dataCount
        });
    }

    generalChartBar(){
        var width = 400, height = 275,
            rectPadding = 4, padding = {left:50, right:30, top:20, bottom:20};
        //添加画布
        d3.select('#chartSvg').remove();
        var svg = d3.select('#chartBar')
            .append('svg')
            .attr('id', "chartSvg")
            .attr('width',width)
            .attr('height', height);

        //定义数据数组
        var dataSet = this.state.dataCount;
        //定义比例尺
        var scaleX = d3.scaleBand()
                .domain([1,2,3,4,5,6,7,8,9,10,11,12])
                .range([0, width - padding.left - padding.right]),
            scaleY = d3.scaleLinear()
                .domain([0, d3.max(dataSet)])
                .rangeRound([height - padding.bottom- padding.top, 0]);

        //添加矩形图
        svg.selectAll('.Rect')
            .data(dataSet)
            .enter()
            .append('rect')
            .attr('class', 'Rect')
            .attr('fill', 'deepskyblue')
            .attr("transform","translate(" + padding.left + "," + padding.top + ")")
            .attr('x', function (d, i) {
                return scaleX(i + 1) + rectPadding / 2;
            })
            .attr('width', scaleX.bandwidth() - rectPadding)
            .attr('y', height - padding.bottom - padding.top)
            .attr('height', 0)
            .transition()
            .duration(1000)
            .delay(function (d,i) {
                return 200 * i;
            })
            .ease(d3.easeBounce)
            .attr('y', function (d) {
                return scaleY(d);
            })
            .attr('height', function (d) {
                return height - scaleY(d) - padding.bottom - padding.top;
            });

        svg.selectAll('.Rect')
            .on('mouseover', function(d, i){
                d3.select(this)
                    .attr('fill', 'red')
            })
            .on('mouseout',function(d,i){
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr('fill', 'deepskyblue');
            });

        //添加文字
        svg.selectAll('.Text')
            .data(dataSet)
            .enter()
            .append('text')
            .attr('class','Text')
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
            .attr("x", function(d,i){
                return scaleX(i + 1) + rectPadding/2;
            })
            .attr("y",function(d){
                return scaleY(d);
            })
            .attr("dx",function(){
                return (scaleX.bandwidth() - rectPadding)/2;
            })
            .attr("dy",function(d){
                return -3;
            })
            .attr('stroke','white')
            .attr("stroke-width", 1)
            .text(function(d){
                return d;
            });
        //添加坐标轴
        svg.append('g')
            .attr('transform', 'translate(' + padding.left + ',' + (height - padding.bottom) + ')')
            .attr('stroke', 'white')
            .attr("stroke-width", 1)
            .call(d3.axisBottom(scaleX));

        svg.append('g')
            .attr('stroke', 'white')
            .attr('fill', 'white')
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
            .call(d3.axisLeft(scaleY));
        svg.selectAll('.domain')
            .attr('stroke','white')
    }

    fetchData(){
        let item = this.getDetailData(), result;
        //如果数据存在，无需查询
        if (ChartBar.isEmptyObject(item)){
            //dataUrl
            let url = proxy;
            if (this.props.currentMapLevel === 0){
                url += '/china/time';
            }else if (this.props.currentMapLevel === 1){
                url += `/province/time/${this.props.selectedProvince}`
            }else{
                url += `/city/time/${this.props.selectedCity}`
            }
            result = fetch(url)
                .then( (response) => {
                    return response.json();
                }).then((json)=>{
                //存入数据仓库
                if (this.props.currentMapLevel === 0){
                    this.provinceStore = json;
                }else if (this.props.currentMapLevel === 1){
                    this.cityStore[this.props.selectedProvince] = json;
                }else{
                    this.areaStore[this.props.selectedCity] = json;
                }
                return json;
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            });
        }else {//数据已存在
            let tmpJson = {};
            if (this.props.currentMapLevel === 0){
                tmpJson = this.provinceStore;
            }else if (this.props.currentMapLevel === 1){
                tmpJson = this.cityStore[this.props.selectedProvince];
            }else{
                tmpJson = this.areaStore[this.props.selectedCity];
            }
            result = new Promise((resolve)=>{
                resolve(tmpJson)
            }) ;
        }
        return result;
    }

    static isEmptyObject(obj){
        for (let i in obj)
            return false;
        return true;
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
        return this.props.currentMapLevel === 0 ? dataJson : (this.props.currentMapLevel === 1 ? dataJson[this.props.selectedProvince] : dataJson[this.props.selectedCity]);
    }

    render() {
        this.fetchData()
        this.generalChartBar();
        return (
            <div style={{backgroundColor:'#2e3443', marginTop:'2', marginRight:'20', position:'relative'}} className="center">
                <h5 style={{margin:'0', paddingTop: '5'}}>时间划分</h5>
                <Form style={{position:"absolute", right: "1%", top : '1px'}}>
                    <FormGroup controlId="formControlsSelect" bsSize="small">
                        <FormControl componentClass="select" placeholder="select" onChange={(e)=>{
                            this.setState({filter: e.target.value}, ()=>{this.dataFilter()})
                        }}>
                            {this.state.select.map((item)=>{
                                return (<option value={item} key={item}>{item}</option>)
                            })}
                        </FormControl>
                    </FormGroup>
                </Form>
                <div id="chartBar"/>
            </div>);
    }
}

let mapStateToProps = (state)=>{
    return {
        selectedProvince : state.common.selectedProvince || -1,
        selectedCity : state.common.selectedCity || -1,
        currentMapLevel : state.common.currentMapLevel || 0, //0 为国家，1为省，2为市
    }
};

let mapDispatchToProps = (dispatch)=>{
    return {
        getData : () => dispatch({type: "getData"})
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(ChartBar);