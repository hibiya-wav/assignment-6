/*
  Daniel Santos Martinez
  UCID: ds73
  November 20, 2024
  ASSIGNMENT 6
*/

import React, {Component} from "react";
import "./areaChart.css";
import * as d3 from "d3";

class AreaChart extends Component {
    // constructor(props) {
    //     super(props);
    // }
    // state = {};

    componentDidMount() {
        // initial render with the initial data from the prop
        this.chartRender();
    }

    componentDidUpdate(prevProps, prevState) {
        // to ensure the data always refreshes when the data gets uploaded and/or when we change the company and month
        if (prevProps.csv_data !== this.props.csv_data) {
            this.chartRender();
        }
    }

    chartRender() {
        // d3 function to do all the work with processing the data and rending the line chart

        // mapping the data correctly for d3 to be able to process it correctly.
        const data = this.props.csv_data.map((data_map) => ({
            ...data_map,
            Date: new Date(data_map.Date),
            "LLaMA-3.1": +data_map["LLaMA-3.1"],
            Claude: +data_map.Claude,
            "PaLM-2": +data_map["PaLM-2"],
            Gemini: +data_map.Gemini,
            "GPT-4": +data_map["GPT-4"]
        }));

        const width = 800;
        const height = 600;
        const margin = {top: 200, right: 30, bottom: 30, left: 40};
        d3.select(".stacked-area-visualization").selectAll("*").remove();

        // creating the svg element to place the stacked plot in
        const svg_element = d3.select(".stacked-area-visualization")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // the xScale is scaled with the dates of the csv data
        const xScale = d3.scaleTime()
            .domain(
                d3.extent(data, function (d) {
                    return d.Date;
                })
            )
            .range([margin.left * 4, width - 200]);

        // the yScale is scaled with the data of the csv data from min to max
        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, (d) => Math.min(d["GPT-4"], d.Gemini, d["PaLM-2"], d.Claude, d["LLaMA-3.1"])),
                d3.max(data, (d) => Math.max(d["GPT-4"], d.Gemini, d["PaLM-2"], d.Claude, d["LLaMA-3.1"]))
            ])
            .range([height - 450, 50]);

        // defining the stacked area line charts & their colors
        const ML_models = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
        const Legend_colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
        const Legend_colors_legendColorFix = ['#ff7f00', '#984ea3', '#4daf4a', "#377eb8", '#e41a1c'];

        // stacking operations
        const stackTerms = d3.stack().keys(ML_models)
        const stackedData = stackTerms(data);

        // area generator and their height & width definitions with curves
        const areaGenerator = d3.area()
            .x(function (d) {
                return xScale(d.data.Date);
            })
            .y0(function (d) {
                // console.log("y0 value:", /**/d[0]);
                return yScale(d[0]);
            })
            .y1(function (d) {
                // console.log("y1 value:", d[1]);
                return yScale(d[1]);
            })
            .curve(d3.curveCardinal);


        // tooltip declaration with appending the svg
        const tooltipVisualization = d3.select(".stacked-area-visualization")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        tooltipVisualization.append("svg")
            .attr("width", 300)
            .attr("height", 150);

        // this function is used to generate the bar chart that appears when the tooltip hovers over the stacked area
        function generateBarChart(event, d) {
            const tooltipSvg = tooltipVisualization.select("svg");
            tooltipSvg.selectAll("*").remove();

            const chartingModel = d.key;
            const modelColor = Legend_colors[ML_models.indexOf(chartingModel)];

            // we filter and sort the data because without this, the data on the tooltip messes up and doesn't output the
            // data and dates correctly.
            // done to correctly filter the dates by months
            const sortedDateData = [...data].sort((a, b) => a.Date - b.Date).filter(d => {
                const month = d.Date.getMonth();
                return month >= 0 && month <= 10;
            });

            const barChartMargins = {top: 20, right: 20, bottom: 30, left: 40};
            const barChartWidth = 200 - barChartMargins.left - barChartMargins.right;
            const barChartHeight = 150 - barChartMargins.top - barChartMargins.bottom;

            // the xscale of the barchart is scaled with the months of the date
            const xScaleBarChart = d3.scaleBand()
                .domain(sortedDateData.map(d => d3.timeFormat("%b")(d.Date)))
                .range([0, barChartWidth + 120])
                .padding(0.1);

            // the yscale is scaled linearly with the data
            const yScaleBarChart = d3.scaleLinear()
                .domain([0, d3.max(sortedDateData, d => d[chartingModel])])
                .range([barChartHeight, 0]);


            // Bar Chart d3 functions to make them work on the tooltip and appear
            const barCharts = tooltipSvg.append("g")
                .attr("transform", `translate(${barChartMargins.left},${barChartMargins.top})`);

            barCharts.selectAll(".barChart")
                .data(sortedDateData)
                .enter()
                .append("rect")
                .attr("class", "barChart")
                .attr("x", function (d) {
                    return xScaleBarChart(d3.timeFormat("%b")(d.Date));
                })
                .attr("y", function (d) {
                    return yScaleBarChart(d[chartingModel]);
                })
                .attr("width", xScaleBarChart.bandwidth())
                .attr("height", function (d) {
                    return barChartHeight - yScaleBarChart(d[chartingModel]);
                })
                .attr("fill", modelColor);

            // adding the x axis with the proper measurements for the tick labels
            barCharts.append("g")
                .attr("transform", `translate(0,${barChartHeight})`)
                .call(d3.axisBottom(xScaleBarChart))
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("dx", "-.8em")
                .attr("dy", ".50em");

            // adding the y axis with ticks relating to the data of the bar charts.
            barCharts.append("g")
                .call(d3.axisLeft(yScaleBarChart).ticks(5));
        }

        const drawEverythingStackedArea = () => {
            // X AXIS | MONTHS TICKS ONLY
            svg_element.append("g")
                .attr("transform", `translate(0, ${height - 430})`)
                .call(d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")))
                .selectAll("text")
                .attr("class", "x-axis-label")
                .style("text-anchor", "middle")

            // LEGEND BOXES and text creation
            for (var i in ML_models) {
                svg_element.append("rect")
                    .attr("x", width - 175)
                    .attr("y", -20 + i * 30)
                    .attr("width", 25)
                    .attr("height", 25)
                    .style('fill', Legend_colors_legendColorFix[i]);

                svg_element.append("text")
                    .attr("x", width - 145)
                    .attr("y", -6 + i * 30)
                    .text(ML_models[i])
                    .attr("alignment-baseline", "middle");
            }

            // drawing the stacked area
            svg_element.selectAll(".layer")
                .data(stackedData)
                .enter()
                .append("path")
                .attr("class", "layer")
                .attr("d", areaGenerator)
                .style("fill", function (d, i) {
                    return Legend_colors[i];
                })
                .on("mouseover", function (event, d) {
                    tooltipVisualization.transition()
                        .duration(200)
                        .style("opacity", 1);
                })
                .on("mousemove", function (event, d) {
                    generateBarChart(event, d);
                    tooltipVisualization
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function () {
                    tooltipVisualization.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        }

        // this literally calls and does everything.
        if (data && data.length > 0) {
            drawEverythingStackedArea();
        }
    }

    render() {
        return (
            <div className="child1">
                {/* Stacked Area chart div */}
                <div className="stacked-area-visualization"></div>
            </div>
        );
    }
}

export default AreaChart;
