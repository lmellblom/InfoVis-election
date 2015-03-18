/*
    The main file for the application. 
    The colors is stored here to get them right everywhere. 
    Linnea Malcherek and Linnéa Mellblom
    2015
*/

//Color for the parties
var colorParty = {
        "Moderaterna" : "#1b49dd",
        "Centerpartiet" : "#009933",
        "Folkpartiet" : "#6bb7ec",
        "Kristdemokraterna" : "#231977",
        "Miljöpartiet" : "#83cf39", 
        "Socialdemokraterna" : "#ee2020",
        "Vänsterpartiet" : "#af0000",
        "Sverigedemokraterna" : "#dddd00", 

        // when we show which block who won
        "Alliansen" : "#4DA6FF",
        "Vänstern" : "#FF4D4D",
        "övriga partier" : "#707070",
        "Andra" : "#707070",
    }

var population = new population("Sverige", 2010);
var income = new income("Sverige", 2010); 
var election = new election("Sverige", 2010);
var map = new map();
