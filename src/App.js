/*
  Daniel Santos Martinez
  UCID: ds73
  November 29, 2024
  ASSIGNMENT 6
*/

import React, { Component } from "react";
import "./App.css";
import FileUpload from "./FileUpload";
import AreaChart from "./areaChart";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }

  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  };

  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data}></FileUpload>
        <div className="parent">
          <AreaChart csv_data={this.state.data}></AreaChart>
        </div>
      </div>
    );
  }
}

export default App;
