/*
    Handles all functions and information that needs to access the Election results. 
    Linnea Malcherek and Linnéa Mellblom
    2015
*/
function election(mun,year){
    var self = this;
    self.y = 2010; // the year that is choosen att the beginning
    loadData(year,mun);
    self.mun = "Sverige"; //From the beginning

    self.sortDataMining=""; // value for the sorting when showing top 3 like munipicalities

    var PERCENTPARTY = "Year="+self.y;

    var votes = d3.select("#mun");
    var votesDiv = $("#mun");
    var sim = d3.select("#sim");
    var simDiv = $("#sim");
    var first = d3.select("#firstDonut");
    var firstDiv = $("#firstDonut");
    var second = d3.select("#secondDonut");
    var secondDiv = $("#secondDonut");
    var third = d3.select("#thirdDonut");
    var thirdDiv = $("#thirdDonut");

    // for pie chart
    var width = 350, height = votesDiv.height(), radius1 = Math.min(width,height)/2, radius2 = Math.min(width,height)/3;
    var color = d3.scale.category20();
    self.startAng = -Math.PI/2;
    self.endAng = Math.PI/2;

    var parties = [
        'Vänsterpartiet',
        'Socialdemokraterna',
        'Miljöpartiet',
        'övriga partier',
        'Sverigedemokraterna',
        'Kristdemokraterna',
        'Centerpartiet',
        'Folkpartiet',
        'Moderaterna'
    ];

    var ALLIANSEN = [parties[5], parties[6], parties[7], parties[8]];
    var VÄNSTERN = [parties[0], parties[1], parties[2]];
    var ANDRA = [parties[3], parties[4]];
   
    //Arc for the big donut chart
    //Party
    var arc1 = d3.svg.arc()
        .innerRadius(radius1 - 115)
        .outerRadius(radius1 - 70);
    //Block
    var arc2 = d3.svg.arc()
        .innerRadius(radius1 - 55)
        .outerRadius(radius1 - 25);

    //Arc for the three small donut charts
    //Party
    var arc3 = d3.svg.arc()
        .innerRadius(radius2 - 75)
        .outerRadius(radius2 - 55);
    //Block
    var arc4 = d3.svg.arc()
        .innerRadius(radius2 - 45)
        .outerRadius(radius2 - 25);

    //The order we append things matter, so header name first, then svg, then percent per block
    var nameHeaderVotes = votes
        .append("h2")
        .attr("class", "munName");

    var nameHeaderSim1 = first
        .append("h3")
        .attr("class", "munName");
    var firstMoreInfo = first.append("p").attr("class", "similarInfo");

    var nameHeaderSim2 = second
        .append("h3")
        .attr("class", "munName");
    var secondMoreInfo = second.append("p").attr("class", "similarInfo");

    var nameHeaderSim3 = third
        .append("h3")
        .attr("class", "munName");
    var thirdMoreInfo = third.append("p").attr("class", "similarInfo");

    //For the big donut chart
    var svg = votes.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    //For the small donut charts
    var svg2 = first.append("svg")
        .attr("width", 300)
        .attr("height", simDiv.height())
        .append("g")
        .attr("transform", "translate(" + 300 / 2 + "," + simDiv.height() / 2.5 + ")");
    var svg3 = second.append("svg")
        .attr("width", 300)
        .attr("height", simDiv.height())
        .append("g")
        .attr("transform", "translate(" + 300 / 2+ "," + simDiv.height() / 2.5 + ")");
    var svg4 = third.append("svg")
        .attr("width", 300)
        .attr("height", simDiv.height())
        .append("g")
        .attr("transform", "translate(" + 300 / 2 + "," + simDiv.height() / 2.5 + ")");

    //Paths
    var path1 = svg.selectAll("path");    
    var pathBlock1 = svg.selectAll("path");
    var path2 = svg2.selectAll("path");    
    var pathBlock2 = svg2.selectAll("path");
    var path3 = svg3.selectAll("path");    
    var pathBlock3 = svg3.selectAll("path");
    var path4 = svg4.selectAll("path");    
    var pathBlock4 = svg4.selectAll("path");

    //Default value
    var file = "data/Swedish_Election_" + self.y + ".csv";
    //Load data
    d3.csv(file, function(error, data) {
        self.data = data;
    });

    var similarParties = votes.append("p").attr("class", "similar");

    //Function for loading the data and also calculating winner in each munipicality
    function loadData(year,mun) {
        var file = "data/Swedish_Election_" + year + ".csv";
        // load data
        d3.csv(file, function(error, data) {
            self.data = data.filter(function(d){
                    return (d["party"]!="ogiltiga valsedlar" &&
                     d["party"]!="ej röstande");
                });

            // arrange the data so that the key will be the region/municipality name
            self.keyData = d3.nest()
                .key(function(d) {return d.region.slice(5, d.region.length);})
                .entries(data);

            // arrange the data in every municiaplity to key region and then the party
            self.mappedData = d3.nest()
                .key(function(d) {return d.region.slice(5, d.region.length);})
                .key(function(d){return d.party})
                .map(self.data, d3.map)["_"];

            // calculates the winners in every municipality
            self.calculatedData = d3.nest()
                .key(function(d) {
                    return d.region.slice(5, d.region.length);
                })
                .rollup(function(d){
                    var max = d3.max(d, function(g){
                        return +g[PERCENTPARTY];
                    });
                    
                    // find the party who has the max value 
                    var part=""; 
                    d.forEach(function(g){
                        if ( g[PERCENTPARTY] == max ){
                            part = g.party;
                            return;
                        }
                    });

                    // sum for block
                    var all = +d3.sum(d.filter(function(h){
                        return ALLIANSEN.indexOf(h.party) !=-1 ;
                    }), function(g){
                        return +g[PERCENTPARTY];
                    }).toFixed(1); // one decimal

                    // sum for rödgröna
                    var right = +d3.sum(d.filter(function(h){
                        return VÄNSTERN.indexOf(h.party) !=-1 ;
                    }), function(g){
                        return +g[PERCENTPARTY];
                    }).toFixed(1); // one decimal

                    // sum for other
                    var other = +d3.sum(d.filter(function(h){
                        return ANDRA.indexOf(h.party) !=-1 ;
                    }), function(g){
                        return +g[PERCENTPARTY];
                    }).toFixed(1); // one decimal

                    var winnerBlock = (all > right ? 'Alliansen' : 'Vänstern');

                    return {winner : part, percent : max, alliansen : all, vänster : right, andra : other, block: winnerBlock }; 
                })
                .map(self.data, d3.map)["_"];

            // on radio buttons change for sorting/data mining
            d3.selectAll(".dataMining").on("click", function(){
                var value = this.value; 
                self.sortDataMining = value;  // store the value sort on

                // update the small pie charts 
                var top3 = similarMun(self.mun, self.sortDataMining); //only show when in municipality
                showSimilarMun(top3);
            });

            updateMunicipality(mun); //to see that the data has been loaded and updated 
        });
    }

    // is called to update the views
    this.selectMun = function(mun, year){
        if (self.y != year) {
            self.y = year;
            loadData(year,mun);
        } 
        else {
            self.mun = mun; // store the selected munipicality
            updateMunicipality(mun);
        }
    }

    //Return the party who is the winner
    this.getWinnerParty = function(mun) {
        return self.calculatedData[mun].winner;
    }

    //Return the block who is the winner
    this.getWinnerBlock = function(mun) {
        return self.calculatedData[mun].block;
    }

    //Update the election. Does it every time you press on a municipality in the map
    function updateMunicipality(mun) {
        updateHeader(mun); 
        [path1, pathBlock1] = drawPieChart(mun, svg, '1', path1, pathBlock1, arc1, arc2); 

        var topSimilar = similarMun(mun, self.sortDataMining); //only show when in a municipality
        showSimilarMun(topSimilar);
    }

    // get the percent for a specific party in a specific municipality
    this.getVotesforParty = function(mun, partyName) {
        var percent = self.mappedData[mun]["_"][partyName][0][PERCENTPARTY];
        return +percent; 
    }

    function updateHeader(mun){
        //change name on a municipality
        nameHeaderVotes.text(mun);
    }

    // the function for showing similar municipalities, sending in the top 3 municipalities. 
    function showSimilarMun(topSimilar) {
        //The path for every similar pie chart
        [path2, pathBlock2] = drawPieChart(topSimilar[2].key, svg2, "2", path2, pathBlock2, arc3, arc4);
        [path3, pathBlock3] = drawPieChart(topSimilar[1].key, svg3, "3", path3, pathBlock3, arc3, arc4);
        [path4, pathBlock4] = drawPieChart(topSimilar[0].key, svg4, "4", path4, pathBlock4, arc3, arc4);

        nameHeaderSim1.text(topSimilar[2].key) 
            .on("click", function(d){
                return map.focusMun(topSimilar[2].key);
            });
        firstMoreInfo.selectAll("p").remove();
        firstMoreInfo.append("p").attr("class", "income").text(income.getIncome(topSimilar[2].key));
        firstMoreInfo.append("p").attr("class", "population").text(population.getPopulationNr(topSimilar[2].key));

        nameHeaderSim2.text(topSimilar[1].key)
            .on("click", function(d){
            return map.focusMun(topSimilar[1].key);
            });
        secondMoreInfo.selectAll("p").remove();
        secondMoreInfo.append("p").attr("class", "income").text(income.getIncome(topSimilar[1].key));
        secondMoreInfo.append("p").attr("class", "population").text(population.getPopulationNr(topSimilar[1].key));

        nameHeaderSim3.text(topSimilar[0].key)
            .on("click", function(d){
            return map.focusMun(topSimilar[0].key);
            });
        thirdMoreInfo.selectAll("p").remove();
        thirdMoreInfo.append("p").attr("class", "income").text(income.getIncome(topSimilar[0].key));
        thirdMoreInfo.append("p").attr("class", "population").text(population.getPopulationNr(topSimilar[0].key));
    }

    //DATAMINING, find the three municipalities that most resembels the chosen one.
    function similarMun(mun, sortOn){
        var similarData = d3.nest()
            .key(function(d) {
                return d.region.slice(5, d.region.length);
            })

            .rollup(function(d){
                var compareMun = d[0].region;
                compareMun = compareMun.slice(5, compareMun.length);

                // calculates the score for every attribute that the user can choose from
                var sParty = euclidianDistanceParties(mun, compareMun);
                var sBlock = euclidianDistanceBlock(mun,compareMun);
                var sIncome = Math.sqrt( income.getDifference(mun,compareMun));
                var sPeople = Math.sqrt( population.getDifference(mun, compareMun));

                    return {similarParty : sParty, similarBlock : sBlock, similarIncome : sIncome
                        , similarPeople : sPeople  }; 
                })
                .entries(self.data.filter(function(d){
                    // sort out the munipicality we looking at, should not compare it with itself or sweden
                    var compareMun = d.region;
                    compareMun = compareMun.slice(5, compareMun.length);
                    return compareMun != mun && compareMun != "Sverige";
                }));

        // sort depending on the users
        var sorted = similarData.sort(function(a,b){
            switch(sortOn) {
                    case "income":
                        return +a.values.similarIncome > +b.values.similarIncome;
                        break;
                    case "parties":
                        return +a.values.similarParty > +b.values.similarParty;
                        break;
                    case "people":
                        return +a.values.similarPeople > +b.values.similarPeople;
                    case "block":
                        return +a.values.similarBlock > +b.values.similarBlock;
                    default:
                        return +a.values.similarParty > +b.values.similarParty;
                        break;
               }
            });

        // get the top 3
        var sortedTop = [ sorted[0] , sorted[1], sorted[2] ];

        return sortedTop;
    }

    //Returns a value to compare the municipalities with.
    function euclidianDistanceParties(mun1, mun2) {
        var sum = 0.0;

        // the data is arregend like this
        var data1 = self.mappedData[mun1]["_"];
        var data2 = self.mappedData[mun2]["_"];

        // assumes that the two data sets is arranges in the same way, uses euclidian distance. 
        for (var attr in data1) {
            var a1 = parseFloat( data1[attr][0][PERCENTPARTY] );
            var a2 = parseFloat( data2[attr][0][PERCENTPARTY] );
            sum += Math.pow(a1-a2, 2);
        }

        var out =  Math.sqrt(sum); 
        return out; 
    }

    // exactly the same as the function above, just that it compares block instead
    function euclidianDistanceBlock(mun1, mun2) {
        var sum =0.0;

        var data1 = self.calculatedData[mun1];
        var data2 = self.calculatedData[mun2];

        var keys = ["alliansen", "vänster", "andra"];

        for (var i in keys) {
            var keyName = keys[i];
            var a1 = parseFloat( data1[keyName] );
            var a2 = parseFloat( data2[keyName] );
            sum += Math.pow(a1-a2, 2);
        }

        var out =  Math.sqrt(sum); 
        return out; 
    }

    //Function to draw the pie charts
    function drawPieChart(mun, svg, name, path, pathBlock, arcOne, arcTwo) {
        //A placeholder for the text element that will be for the partys percent
        var fontSize = 18;
        svg.append("text")
            .attr("id", "percentParty"+name) 
            .attr("x", -fontSize) 
            .attr("y", -fontSize+15)
            .text('')
            .style("font-size", fontSize + "px");

        var fontSize = 18;
        svg.append("text")
            .attr("id", "partyName"+name)
            .attr("x", -80) 
            .attr("y", 50)
            .text('')
            .style("font-size", fontSize + "px");

        //PIE CHART FOR PARTIES
        var pie = d3.layout.pie()
            .value(function(d) {return +d[PERCENTPARTY]; })
            .startAngle(self.startAng)
            .endAngle(self.endAng)    
            .sort(function(entry1, entry2) {
                return parties.indexOf(entry1.party) > parties.indexOf(entry2.party); 
            }); 

        //Filter the data to only pick out with right municipality
        var filteredData = self.data.filter(function(d){
            var compareMun = d.region;
                compareMun = compareMun.slice(5, compareMun.length);
                return compareMun == mun; 
        })
        //Filter away info that we don't need.
        .filter(function(d){
            return (d["party"]!="ogiltiga valsedlar" &&
             d["party"]!="ej röstande");
        });

        path = path.data(pie(filteredData));

        path.exit().remove();

        path.enter()
            .append("path")
            .attr("id", function(d) {
                return d.data.party.split(' ')[0]+name;
            }); 

        //Handles mouseevents 
        path
            .on("mouseenter", function(d){
                d3.select("#percentParty"+name)
                    .transition().duration(200).style("opacity", 1.0);
                d3.select("#percentParty"+name)
                    .text(d.data[PERCENTPARTY]);

                d3.select("#partyName"+name)
                    .transition().duration(200).style("opacity", 1.0);
                d3.select("#partyName"+name)
                    .text(d.data.party);

                d3.select("#" + d.data.party.split(' ')[0]+name) // bara för att se till så inte id blir fler än ett ord..
                    .transition().duration(500)
                    .attr("transform", "scale(1.1)");
            })
            .on("mouseout", function(d){ // ngt med att när man inte klickat så ska denna sätta igång, annars inte... 
                d3.select("#percentParty"+name)
                    .transition().duration(500).style("opacity", 0);
                d3.select("#partyName"+name)
                    .transition().duration(500).style("opacity", 0);

                d3.select("#" + d.data.party.split(' ')[0]+name)
                    .transition().duration(500)
                    .attr("transform", "scale(1.0)");
            });

        //Transition between data 
        path.transition()
            .duration(500)
            .attr("fill", function(d, i) { 
                var partyWon = (d.data.party);
                    return colorParty[partyWon];})
            .attr("d", arcOne)
            .each(function(d) { this._current = d; }); //Store the initial angles 

        //PIE CHART FOR BLOCK
        //List of percent for blocks
        var blockList = [self.calculatedData[mun].vänster, self.calculatedData[mun].andra, self.calculatedData[mun].alliansen];
        //Object to get name of block
        var blockObj = [{blockName: "Rödgröna", blockPercent: self.calculatedData[mun].vänster},
                        {blockName: "Andra partier", blockPercent: self.calculatedData[mun].andra},
                        {blockName: "Alliansen", blockPercent: self.calculatedData[mun].alliansen}];

        //Pie chart for blocks
        var pieBlock = d3.layout.pie()
            .value(function(d, i) {return d.blockPercent})
            .startAngle(self.startAng)
            .endAngle(self.endAng)    
            .sort(null); 
        
        pathBlock = pathBlock.data(pieBlock(blockObj));

        pathBlock.enter()
            .append("path")
            .attr("id", function(d) {
                return d.data.blockName.split(' ')[0]+name;
            }); 

        //Handles mouseevents
        pathBlock
            .on("mouseenter", function(d, i){
                d3.select("#percentParty"+name)
                    .transition().duration(200).style("opacity", 1.0);
                d3.select("#percentParty"+name)
                    .text(d.value);

                d3.select("#partyName"+name)
                    .transition().duration(200).style("opacity", 1.0);
                d3.select("#partyName"+name)
                    .text(d.data.blockName);

                d3.select("#" + d.data.blockName.split(' ')[0]+name) // bara för att se till så inte id blir fler än ett ord..
                    .transition().duration(500)
                    .attr("transform", "scale(1.05)");
            })
            .on("mouseout", function(d){ // ngt med att när man inte klickat så ska denna sätta igång, annars inte... 
                d3.select("#percentParty"+name)
                    .transition().duration(500).style("opacity", 0);
                d3.select("#partyName"+name)
                    .transition().duration(500).style("opacity", 0);


                d3.select("#" + d.data.blockName.split(' ')[0]+name)
                    .transition().duration(500)
                    .attr("transform", "scale(1.0)");
            });

        //Transition between data
        pathBlock.transition()
            .duration(500)
            .attr("fill", function(d, i) {
                if(d.data.blockName==blockObj[0].blockName)
                {
                    return colorParty["Vänstern"];
                }
                else if(d.data.blockName==blockObj[1].blockName)
                {
                    return colorParty["Andra"];
                }
                else
                    return colorParty["Alliansen"];})
            .attr("d", arcTwo)
            .each(function(d) { this._current = d; }); // store the initial angles 

        return [path, pathBlock];
    }
}