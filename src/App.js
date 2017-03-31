import React, { Component } from 'react';
import {FormControl, Row, Col, Button, FormGroup, Form} from 'react-bootstrap/lib'
import {connect} from 'react-redux'

import Map from './d3/map';
import PieChart from './d3/PieChart';
import ChartBar from './d3/ChartBar';
import './style/index.css'

class AppUI extends Component {
    render() {
        return (
            <div>
                <Row>
                    <h2 style={{textAlign:'center', marginBottom: '20'}}>基于用户轨迹的区域可视化分析</h2>
                </Row>
                <Row>
                    <Col md={2}>
                        <div style={{backgroundColor:'#2e3443', height:'600', padding: "10"}} className="center">
                            <Form>
                                <FormGroup controlId="formControlsSelect" bsSize="small">
                                    <FormControl componentClass="select" placeholder="select" onChange={(e)=>{

                                    }}>
                                        <option value={"text"}>全文搜索</option>
                                        <option value={"uid"}>用户ID</option>
                                    </FormControl>
                                </FormGroup>
                                <FormGroup controlId="search">
                                    <FormControl type="text" placeholder="" inline/>{'  '}
                                </FormGroup>
                                <FormGroup controlId="search">
                                    <Button>Search</Button>
                                </FormGroup>
                            </Form>
                        </div>
                    </Col>
                    <Col md={7}>
                        <Map />
                    </Col>
                    <Col md={3}>
                        <span><PieChart/></span>
                        <span><ChartBar/></span>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default AppUI;
