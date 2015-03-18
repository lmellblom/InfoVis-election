/*
    Handles all functions and information that needs to access the income results. 
    Linnea Malcherek and Linnéa Mellblom
    2015
*/
function income(mun,year) {
	var self = this;
    var element = d3.select("#inc");
    var element2 = d3.select("#rank");
    var YEARS = ["2002","2006","2010"];
    self.y = year;
    self.municipality = mun;  

    loadData();

    var SCALE, color;

    var header = element.append("h3")
        .attr("class", "income");
    var incomeNumber = element2.append("h3")
        .attr("class", "incomeNr");

    this.selectIncome = function(mun, year){
        self.municipality = mun;
        self.y=year; 
        update();
    }

    // load the data once and see so that it will draw something in the beginning
    function loadData() {
    	var file = "data/income.csv";
     
        d3.csv(file, function(error, data) {
            self.data = data.filter(function(d){
                    return d["ålder"] == "20-64 år"; 
            }); // just want to show the ages 20-64

            // arrange the data to sort on income
            self.data2 = self.data
                .sort(function(a,b){
                    return +a[self.y] < +b[self.y];
                });

           // arrange data so that the key is the municipality
           	self.mData = d3.nest()
                .key(function(d) {return d.region.slice(5, d.region.length);})
                .rollup(function(d){
                	d=d[0]; //the roll up function gives a list, so a quick fix.
                	
                    var out = {};

                    for (ye in YEARS)  {
                        out[ YEARS[ye] ] = d[ YEARS[ye] ];
                    }   

                    // to now which place the municipality is one, self.data2 is sorted so gets the position from there
                    for (var i in self.data2){
                        var name = self.data2[i].region;
                        name = name.slice(5, name.length);
                        var stripName = d.region.slice(5, d.region.length); 
                        if (name == stripName){
                            out.place = i;
                        }
                    }

                    return out;
                })
                .map(self.data2, d3.map)["_"];

            // create scale for the income.
            var dataMun = self.data
                .filter(function(d){
                    return d["region"] != "0000 Sverige"; 
                });
            var minScale = d3.min(dataMun, function(d){
                    return +d[self.y];
            });
            var maxScale = d3.max(dataMun, function(d){
                    return +d[self.y];
            });
            var meanScale = d3.mean(dataMun, function(d){
                    return +d[self.y];
            });
            SCALE = d3.scale.linear()
                .domain([minScale, maxScale])
                .range([0 , 3]);

            // creates color if want to map on income. 
            color = d3.scale.threshold()
                .domain([minScale, meanScale , maxScale])
                .range(["#ffffcc","#c2e699","#78c679"]);

            update();

            // input range on the income part!
            d3.select("#income")
                .attr("min", 1)
                .attr("max", dataMun.length);			
		});	

    }

    this.getNumber = function (mun){
        // decide which place the municipality is regarding on income
        var nr = self.mData[mun].place;
        return +nr;
    }

    // gets the inome for the municipality the given year
    this.getIncome = function(mun){
        return +self.mData[mun][self.y];
    }

    this.getScale = function(m) {
        var inkomst = +self.mData[m][self.y];
        var skala = SCALE(inkomst);
        return +skala;
    }

    // get the difference between two municipalities
    this.getDifference = function(mun, compMun){
        var diff = +self.mData[mun][self.y] - +self.mData[compMun][self.y];
        return Math.pow(diff,2);
    }

    this.getColor = function(m) {
        return color( self.mData[m][self.y] );
    }

    // updates the income in the information box
    function update() {
        header
            .text(function(d) {
                return self.mData[self.municipality][self.y];
            });

        // display which place the municipality is on in income. 
        incomeNumber
            .text(function(d){
                var number = +self.mData[self.municipality].place + 1;
                if(self.municipality == "Sverige")
                    return " - ";
                return "Plats: " + number + " i inkomst";
            });
    }

}