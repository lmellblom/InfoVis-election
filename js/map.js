/*
    Handles all functions that regards the map
    Parts of the zoom and interaction with the map is taken from
    http://bl.ocks.org/mbostock/9656675

    Linnea Malcherek and Linnéa Mellblom
    2015
*/
function map() {
    var self = this;
    var isChecked; // for the buttons
    var mapDiv = $("#map");

    var width = mapDiv.width(),
        height = mapDiv.height(),
        active = d3.select(null);

    // create map so that it will fit the element
    var margin = 10;
    var h = height - 2 * margin;  //New desired height on the map
    var s = h / 0.525; //The scale, the map has width 0.23125 and height 0.525 (the relation between)
    
    //Found values by hand 
    var translateX = width/2-286,  
        translateY = height/2+1300;

    //The width should not be larger than the container, if so -> scale
    if (s*0.23125 > width){
        s = (width-2*margin) / 0.23125;
        translateX += 104;          
        translateY -= 442;
    } 

    // create the projection with the right scale and translation
    var projection = d3.geo.mercator()
        .scale(s)
        .translate([translateX, translateY]);

    var zoom = d3.behavior.zoom()
        .translate([0,0])
        .scale(1)
        .scaleExtent([1,8])
        .on("zoom", zoomed);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("click", stopped, true);
 
    // tooltip
    var tooltip = d3.select("body").append("div")
	    .attr("class", "tooltip")
	    .style("opacity", 0);

    // append the rectangel behind the map to be able to zoom out again
    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height)
        .on("click", reset);

    var g = svg.append("g");

    svg 
        .call(zoom) // delete to disable free zooming
        .call(zoom.event);

    // load data and draw
    d3.json("data/sweden_mun.topojson", function(error, sweden) {
        self.mun = topojson.feature(sweden, sweden.objects.swe_mun).features;
        var munMesh = topojson.mesh(sweden.objects.swe_mun, function(a, b) { return a !== b; });
        
        g.selectAll("path")
            .data(self.mun)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "swe_mun")
            .attr("title", function(d) { 
                var s = population.getScale[d.properties.name];
                return d.properties.name; })

            // color the mun
            .style("fill", function(d){
                // deside if color the map with the winner in block or party, just in the beginning sets a preset color
                return "#ACACAC";
            })

            //tooltip
            .on("mousemove", function(d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(d.properties.name)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout",  function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

            // for changing data for the other views and also zoom in on the map
            .on("click", clicked);

            g.append("path")
                .datum(munMesh)
                .attr("class", "mesh")
                .attr("d", path)
                .data(self.mun);

            // on radio buttons change!
            d3.selectAll(".colorTheMap").on("click", function(){
                var value = this.value; 
                var func = (value == "Block" || value == "Party" ?  self.colorMap : self.colorMapOnPop );
                func(value);

            });

            // on filter changes!! 
            d3.select("#income").on("input", function() {
                updateFilter();
            });
            d3.select("#populations").on("input", function() {
                updateFilter();
            });

            // set default values
            self.colorMap("Block"); // default value 
            filterOnIncome(1);
            filterOnPopulation(1);


    });

    //Called when filter slider is used 
    function updateFilter() { 
        var i = +d3.select("#income")[0][0].value; 
        var p = +d3.select("#populations")[0][0].value; // convert this value if logarithmic scale

        // reset value
        g.selectAll("path").style("opacity", 1.0);
        filterOnIncome(i);
        filterOnPopulation(p);
    }

    // calls every other functions to update the different views. sending in the municipality name
    function showDataFromMun(d) {
        election.selectMun(d.properties.name, 2010);
        population.selectPopulation(d.properties.name, 2010);
        income.selectIncome(d.properties.name, 2010);
    }

    // color the map. the element decide if block or party. 
    this.colorMap = function(element) {
        var func = (element == "Block" ? election.getWinnerBlock : election.getWinnerParty);  // save which function to use. 

        g.selectAll("path")
            .data(self.mun)
            .transition()
            .duration(400)
            .style("fill", function(d){
                var partyWon = func(d.properties.name); 
                if (colorParty[partyWon])
                    return colorParty[partyWon];
            });

    }

    // filters the map depending on the population
    function filterOnPopulation(filterPopValue){
        var value = population.toDomain(filterPopValue);
        // the filter values text changes. 
        d3.select("#populations-value").text(value);
        d3.select("#populations").property("value", filterPopValue);

        g.selectAll("path")
            .data(self.mun)
            .filter(function(d){
                var pop = population.getPopulationNr(d.properties.name);
                return value > pop; 
            })
            .style("opacity", 0.3);
    }

    var scale = d3.scale.linear().domain([290,1]).range([1,290]);
    function filterOnIncome(filterIncomePlace) { //Place on the income scale 
        var place = Math.floor(scale(filterIncomePlace)); 
        d3.select("#income-value").text(place);
        d3.select("#income").property("value", filterIncomePlace);

        g.selectAll("path")
            .data(self.mun)
            .filter(function(d){
                var nr = income.getNumber(d.properties.name);
                return nr > place; 
            })
            .style("opacity", 0.3); // om icheckad så ska den sänkas, annars resettas.. 
    }

    // when clicked on a municipality
    function clicked(d) { 
        // if you clicked on the selected municipality, zoom out again. 
        if (active.node() === this) {
            return reset();
        }

        // call every other functions
        showDataFromMun(d);       

        active.classed("active", false);
        active = d3.select(this).classed("active", true);

        // calculate the bounding box
        var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .4 / Math.max(dx / width, dy / height), // how much margin/ how much percent the feature will take up in the container
        translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .call(zoom.translate(translate).scale(scale).event);
    }

    // if the municipality does not exist in the map, zoom out to Sweden in the map but still
    // show the right values. 
    function munNotExistInMap(m) {
        election.selectMun(m, 2010);
        population.selectPopulation(m, 2010);
        income.selectIncome(m, 2010);

        active.classed("active", false);
        active = d3.select(null);

        svg.transition()
            .duration(750)
            .call(zoom.translate([0, 0]).scale(1).event);

    }

    // called when want to zoom in on the map on a specific municipality
    this.focusMun = function(m) {
        // the object that was clicked. 
        var d = self.mun.filter(function(d){
            return d.properties.name == m; 
        })[0];

        if(typeof d == "undefined") {
            return munNotExistInMap(m);
        }

        // the path element
        var element = g.selectAll("path")
            .data(self.mun)
            .filter(function(d){ return d.properties.name == m; })
            .attr("class", "swe_mun active");

        showDataFromMun(d);  

        // reset and activate the right element.    
        active.classed("active", false);
        active = element; 

        //this is a path...   
        var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .5 / Math.max(dx / width, dy / height), // how much margin/ how much percent the feature will take up in the container
        translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .call(zoom.translate(translate).scale(scale).event);

    }

    function reset() {
        // resets the map to Sweden, change the data then in the other views. 
        election.selectMun("Sverige", 2010);
        population.selectPopulation("Sverige", 2010);
        income.selectIncome("Sverige", 2010);

        active.classed("active", false);
        active = d3.select(null);

        svg.transition()
            .duration(750)
            .call(zoom.translate([0, 0]).scale(1).event);
    }

    function zoomed() {
        g.style("stroke-width", 1.0 / d3.event.scale + "px");
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // If the drag behavior prevents the default click,
    // also stop propagation so we don’t click-to-zoom.
    function stopped() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }

    // does not work right now, but in the future to show the parties support in the different municipalities.
    var color = d3.scale.ordinal()
          .range(["#f7f7f7", "#cccccc", "#969696" , "#636363", "#252525"])
          .domain(d3.range(0,4));
    var scales = d3.scale.linear().domain([0,4]).range([0,100]);
    this.colorOnPartyClicked = function(p) {
        g.selectAll("path")
            .data(self.mun)
            .transition()
            .duration(600)
            .style("fill", function(d){
                var percent = election.getVotesforParty(d.properties.name, p);
                return color(scales(percent));
            });
    }
// --------------
}