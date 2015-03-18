/*
    Handles all functions that regards the population
    Linnea Malcherek and Linnéa Mellblom
    2015
*/
function population(mun, year) {
	var self = this;
    var pop = d3.select("#ppl");
    var municipality = mun;
    var y = year; 

    var YEARS = ["2002", "2006", "2010"];

    loadData();

    var header = pop.append("h3")
        .attr("class", "population");

    var SCALE, logSkala; 

    // calles when want to update the population information
    this.selectPopulation = function(mun, year){
            municipality = mun; 
            y = year; 
            update(); 
    }

    function loadData(){
        var file = "data/population.csv";
     
        d3.csv(file, function(error, data) {
            self.data = data;

            // map the data with the region name as the key
            self.data2 = d3.nest()
                .key(function(d) {return d.region.slice(5, d.region.length);})
                .rollup(function(d){
                    d = d[0]; // quick fix.
                    var out = {};
                    for (ye in YEARS)  {
                        out[ YEARS[ye] ] = d[ YEARS[ye] ];
                    }   
                    return out;
                })
                .map(data, d3.map)["_"];

            // create scale for the population, take away the information for Sweden. 
            var dataMun = self.data.filter(function(d){
                return d["region"] != "0000 Sverige"; 
            });
            var minScale = d3.min(dataMun, function(d){
                    return +d[y];
            });
            var maxScale = d3.max(dataMun, function(d){
                    return +d[y];
            });

            SCALE = d3.scale.linear()
                .domain([minScale, maxScale])
                .range([0 , 3]);

            logSkala = d3.scale.log()
                .domain([minScale, maxScale])
                .range([1,100]);

            // set the range sliders values
            d3.select("#populations")
                .attr("min", 1)
                .attr("max", 100);   
            // set the range sliders text
            d3.select("#populations-min").text(minScale);
            d3.select("#populations-max").text(maxScale);
        
            update(); // initiate so something exist from the start
        }); 
    }

    // updates the main header in the information box
    function update() {
        header
            .text(self.data2[municipality][y]);
    }

    // get the population for the municipality for the year
    this.getPopulationNr = function(mun) {
        return self.data2[mun][y]; 
    }

    this.getDifference = function(mun,compMun) {
        var diff = +self.data2[mun][y] - +self.data2[compMun][y];
        return Math.pow(diff,2);
    }

    // to easier map the range slider.
    this.toDomain=function(value){
        var v = logSkala.invert(value);
        return Math.round(v);
    }

    // get scale for the coloring, doesnt work right now so is not used. 
    this.getScale = function(m) {
        var people = +self.data2[m][y];
        var skala = SCALE(people);
        return +skala;
    }
}