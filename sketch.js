var population;
var lifespan = 800;
var titleP;
var lifeP;
var genP;
var timeP;
var mutP;
var countP;
var diagonalLength;
var canvasTitle = 'Basic Example';
var programStarted = false;

// Population Variables
var generations = 0;
var populationSize = 1000;
var count = 0;
var target;
var spawnPoint;
//var populationDestroyed = false;

var bestRecordedTime;
var bestRecordedADN;
var maxforce = 0.2;
var bestTime = lifespan;
var maxSpeed = 20;
var generationsIncomplete = 0;
var lastImproved = 0;
var bestDistance = 600;
var bestADNnow = [];
var mostHatedPoint = [];
var furthestDistance;
var pathfinder;
var mutalimit = 3;

var database;

var wallList = [];

var clickedOnce = false;
var clickedTwice = false;
var firstClickCoords = [];
var skipping = false;
var skippedGenerations = 0;
var skipTarget = false;

// Possible program statuses:
//"Paused", "Running"
var programStatus = 'Paused';

// Possible edit statuses:
// true, false
var editStatus = false;

// Possible edit type statuses:
//"Line", "Target", "Spawn"
var editObjectType = '';

function getPointCoords(){
	var point = {
		x: mouseX,
		y: mouseY
	}

	if(editStatus == true && editObjectType == 'Line' && clickedTwice == true){
		clickedTwice = false;
	}

	if(editStatus == true && editObjectType == 'Line' && clickedOnce == true){
		clickedOnce = false;
		clickedTwice = true;
		var realWide = firstClickCoords[0] - point.x;
		var realTall = firstClickCoords[1] - point.y;
		if(realWide > 0 && realTall > 0){
			wallList.push(new Wall(firstClickCoords[0]-realWide, firstClickCoords[1]-realTall, realWide, realTall));
		} else if(realWide > 0){
			wallList.push(new Wall(firstClickCoords[0]-realWide, firstClickCoords[1], realWide, -realTall));
		} else if(realTall > 0){
			wallList.push(new Wall(firstClickCoords[0], firstClickCoords[1]-realTall, -realWide, realTall));
		} else {
			wallList.push(new Wall(firstClickCoords[0], firstClickCoords[1], -realWide, -realTall));
		}

	}

	if(editStatus == true && editObjectType == 'Line' && clickedOnce == false && clickedTwice == false){
		clickedOnce = true;
		firstClickCoords[0] = point.x;
		firstClickCoords[1] = point.y;

	}

	if(editObjectType == 'Target'){
		editObjectType = ''
	}

	if(editObjectType == 'Spawn'){
		editObjectType = ''
	}

	console.log(point);
	return(point);
}

function clearDrawing(){
	programStatus = "Paused";
	editStatus = true;
	clear();
	background(0);
	target.x = -1000;
	target.y = -1000;
	spawnPoint.x = -1000;
	spawnPoint.y = -1000;
	population = [];
	wallList = [];
	generations = 0;
	count = 0;
	bestTime = lifespan;
	lifeP.html('Rockets alive: ' + populationSize);
	genP.html('Generations passed: ' + generations);
	if(bestTime == lifespan){
	 timeP.html('Fastest time(number of frames): ' + 'Did not reach target yet');
 } else {
	 timeP.html('Fastest time(number of frames): ' + bestTime);
 }
	mutP.html('Mutation rate: ' + 'initial ' + '%');
	countP.html('Batch counter: ' + count);
	//populationDestroyed = true;
}

// Setup canvas
function setup() {
	canvas = createCanvas(600, 500);
	canvas.parent('canvascontainer');
	canvas.mousePressed(getPointCoords)
	diagonalLength = sqrt(width*width + height*height);
	// console.log(width*width);
	// console.log(height*height);
	// console.log(diagonalLength);

	titleTextField = select("#titleOfCanvas");
	background(0);

	mostHatedPoint[0] = 0;
	mostHatedPoint[1] = 0;
	furthestDistance = diagonalLength;


	var startButton = select('#startButton');
	startButton.mousePressed(startProgram);
	function startProgram(){
		programStatus = 'Running';
		programStarted = true;
		editStatus = false;
		editObjectType = '';
		skipping = false;
		skipTarget = false;

		// Create a population if there are not any pops
		if(population == undefined || population.length == 0){
			population = new Population();
			//populationDestroyed = false;
		}

	};

	var pauseButton = select('#pauseButton');
	pauseButton.mousePressed(pauseProgram);
	function pauseProgram(){
		programStatus = 'Paused';
	};

	var skipButton = select('#skipButton');
	skipButton.mousePressed(skipProgram);
	function skipProgram(){
		skipping = true;
	}

	var skipTargetButton = select('#skipTargetButton');
	skipTargetButton.mousePressed(skipTargetButtonProgram);
	function skipTargetButtonProgram(){
		skipping = true;
		skipTarget = true;
	}

	var showBestADNbutton = select('#showBestADNbutton');
	showBestADNbutton.mousePressed(showBestADNbuttonProgram);
	function showBestADNbuttonProgram(){
		console.log("show adn");
	}

	var lineButton = select('#lineButton');
	lineButton.mousePressed(changeStatusLine);
	function changeStatusLine(){
		editObjectType = 'Line';
	}

	var spawnButton = select('#spawnButton');
	spawnButton.mousePressed(changeStatusSpawn);
	function changeStatusSpawn(){
		editObjectType = 'Spawn';
	}

	var targetButton = select('#targetButton');
	targetButton.mousePressed(changeStatusTarget);
	function changeStatusTarget(){
		editObjectType = 'Target';
	}

	var saveButton = select('#saveButton');
	saveButton.mousePressed(saveDrawing);
	function saveDrawing(){
		var ref = database.ref('drawings');
		var wallCoords = [];
		for(var i = 0; i < wallList.length; i++){
			var myWall = {
				x: wallList[i].x,
				y: wallList[i].y,
				w: wallList[i].w,
				h: wallList[i].h
			}
			wallCoords.push(myWall);
		}
		var bestADNtoSend = [];
		for(var i = 0; i < bestADNnow.length; i++){
			var myVect = bestADNnow[i];
			var xCoord = myVect.x;
			var yCoord = myVect.y;
			//console.log(bestADNnow[i]);
			var recVec = {
				x : xCoord,
				y : yCoord
			}
			//console.log(recVec);
			bestADNtoSend.push(recVec);
		}
		var data = {
			name: trim(titleTextField.value()),
			walls: wallCoords,
			spawn: [spawnPoint.x, spawnPoint.y],
			target: [target.x, target.y],
			bestADN: bestADNtoSend,
			bestTimeRecord: bestTime
		};
		var result = ref.push(data, dataSent);
		console.log(result.key);

		function dataSent(err, status){
			console.log(status);
		}
	}

	var clearButton = select('#clearButton');
	clearButton.mousePressed(clearDrawing);


	var editButton = select('#editButton');
	editButton.mousePressed(changeEditStatus);
	function changeEditStatus(){
		programStatus = "Paused"
		editStatus = true;
		clear();
		generations = 0;
		count = 0;
		bestTime = lifespan;
	}


	// Initialize Firebase
  var config = {
    apiKey: "AIzaSyDYun05Zhz-1aOIAixe3OncbaJFXKctILs",
    authDomain: "smart-rockets-evolved.firebaseapp.com",
    databaseURL: "https://smart-rockets-evolved.firebaseio.com",
    projectId: "smart-rockets-evolved",
    storageBucket: "smart-rockets-evolved.appspot.com",
    messagingSenderId: "1047361704258"
  };
  firebase.initializeApp(config);
	database = firebase.database();

	var params = getURLParams();
	console.log(params);
	if(params.id){
		console.log(params.id);
	}

	var ref = database.ref('drawings');
	ref.on('value', gotData, errData);

	titleP = createP();
	titleP.parent('canvasInfo');
	lifeP = createP();
	lifeP.parent('canvasInfo');
	genP = createP();
	genP.parent('canvasInfo');
	timeP = createP();
	timeP.parent('canvasInfo');
	mutP = createP();
	mutP.parent('canvasInfo');
	countP = createP();
	countP.parent('canvasInfo');

	titleP.html('Title of this canvas is: ' + canvasTitle);
	lifeP.html('Rockets alive: ' + populationSize);
	genP.html('Generations passed: ' + generations);
	if(bestTime == lifespan){
	 timeP.html('Fastest time(number of frames): ' + 'Did not reach target yet');
 } else {
	 timeP.html('Fastest time(number of frames): ' + bestTime);
 }
	mutP.html('Mutation rate: ' + 'initial ' + '%');
	countP.html('Batch counter: ' + count);

	target = createVector(width/2, 50);
	spawnPoint = createVector(width/2, height-5);
	// // console.log(spawnPoint)
  //
	// wall = new Wall(width/4, height/2, width/2, 10);
	// wallList.push(wall)
}

function gotData(data){

	//clear listing
	var elts = selectAll('.listing');
	for(var i = 0; i < elts.length; i++){
		elts[i].remove();
	}

	var drawings = data.val();
	var keys = Object.keys(drawings);
	for(var i = 0; i < keys.length; i++){
		var key = keys[i];
		var ref = database.ref('drawings/' + key);
		ref.once('value', oneTitle, errData);
		var title;

		function oneTitle(data){
			var dbdrawing = data.val();
			title = dbdrawing.name;
		}

		console.log(title);
		//console.log(key);
		var li = createElement('li', '');
		li.class('listing');
		var ahref = createA('#', key);
		ahref.mousePressed(showDrawing);
		ahref.parent(li);

		li.parent('drawinglist');
	}
}

function showDrawing(key){
	if(key instanceof MouseEvent){
		var key = this.html();
		clearDrawing();
  }
	var ref = database.ref('drawings/' + key);
	ref.once('value', oneDrawing, errData);

	function oneDrawing(data){
		var dbdrawing = data.val();
		canvasTitle = dbdrawing.name;
		wallListcoords = dbdrawing.walls;
		for(var i = 0; i < wallListcoords.length; i++){
			var newWall = new Wall(wallListcoords[i].x, wallListcoords[i].y, wallListcoords[i].w, wallListcoords[i].h)
			wallList.push(newWall);
		}

		spawnPoint.x = dbdrawing.spawn[0];
		spawnPoint.y = dbdrawing.spawn[1];

		target.x = dbdrawing.target[0];
		target.y = dbdrawing.target[1];

	}
	titleP.html('Title of this canvas is: ' + canvasTitle);
}

function errData(err){
	console.log(err)
}

// Continous Loop
function draw() {
	//console.log(wallList);
	if(programStatus=='Running' && skipping == true && skipTarget == true){
		while(bestTime == lifespan && skippedGenerations < 1000){
			population.run();
			count++;

			if(count == lifespan || population.alive <= 0){
					population.alive = population.popsize;
					population.evaluate();
					population.selectioning();
					if(bestTime > lifespan - 50){
					 population.checkImprovement();
					}
					count = 0;
					generations++;
					skippedGenerations++;
					//console.log(generations);
					}
				}
			skipping = false;
			skippedGenerations = 0;
			skipTarget = false;
		}
	else if(programStatus=='Running' && skipping == true && skipTarget == false){
		while(skippedGenerations < 50){
			population.run();
			count++;

			if(count == lifespan || population.alive <= 0){
					population.alive = population.popsize;
					population.evaluate();
					population.selectioning();
					if(bestTime > lifespan - 50){
					 population.checkImprovement();
					}
					count = 0;
					generations++;
					skippedGenerations++;
					//console.log(generations);
				}
			}
		skipping = false;
		skippedGenerations = 0;
	}
	else if(programStatus=='Running' && skipping == false){
			//console.log('wat');
			background(0);
			fill(255, 155, 155);
			push();
			translate(target.x, target.y);
			ellipse(0, 0, 16, 16);
			pop();
			fill(155, 155, 255);
			push();
			translate(spawnPoint.x, spawnPoint.y);
			ellipse(0, 0, 10, 10);
			pop();
			fill(255);

			for(i = 0; i < wallList.length; i++){
				 wallList[i].show();
			}

		 population.run();

		 // Show Various Info
		 titleP.html('Title of this canvas is: ' + canvasTitle);
		 lifeP.html('Rockets alive: ' + population.alive);
		 genP.html('Generations passed: ' + generations);
		 if(bestTime == lifespan){
			timeP.html('Fastest time(number of frames): ' + 'Did not reach target yet');
		} else {
			timeP.html('Fastest time(number of frames): ' + bestTime);
		}
		 mutP.html('Mutation rate: ' + population.mutationRate + '%');
		 countP.html('Batch counter: ' + count);


		 count++;

		 if(count == lifespan || population.alive <= 0){

			 population.alive = population.popsize;
			 population.evaluate();
			 population.selectioning();
			 if(bestTime > lifespan - 50){
			 	population.checkImprovement();
		 	 }
			 count = 0;
			 generations++;
			 //console.log(generations);
			 population.crashedRockets = 0;

		 }
		 fill(255);

	 } else if (editStatus == false && programStarted == false){
		 background(0);
		 textSize(20);
		 var s = 'Press "start" to see rockets evolve!';
		 fill(255);
		 text(s, 160, height/2, width-40, height-40);
	 }
	 else if(editStatus == true){
		background(0);
	 	fill(255, 155, 155);
		push();
		translate(target.x, target.y);
		ellipse(0, 0, 16, 16);
		pop();
		fill(155, 155, 255);
		push();
		translate(spawnPoint.x, spawnPoint.y);
		ellipse(0, 0, 10, 10);
		pop();
	 	fill(255);

	 	for(i = 0; i < wallList.length; i++){
	 		 wallList[i].show();
	 	}

		 //console.log("editting")
		 if(editObjectType == 'Line'){
			 fill(150);
			 var secondPointX;
			 var secondPointY;
			 if(clickedOnce == true){
				 secondPointX = mouseX;
				 secondPointY = mouseY;
				 //console.log(secondPointX, secondPointY)
				 var howWide = abs(firstClickCoords[0] - secondPointX);
				 var howTall = abs(firstClickCoords[1] - secondPointY);
				 var realWide = firstClickCoords[0] - secondPointX;
				 var realTall = firstClickCoords[1] - secondPointY;

				 rect(firstClickCoords[0], firstClickCoords[1], -realWide, -realTall)
				 //console.log(realWide, realTall)
			 }
		 }
		 if(editObjectType == 'Target'){
			 target.x = mouseX;
			 target.y = mouseY;
		 }
		 if(editObjectType == 'Spawn'){
			 spawnPoint.x = mouseX;
			 spawnPoint.y = mouseY;
		 }
	 }
}


function Wall(x, y, w, h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

	this.show = function(){
		rect(this.x, this.y, this.w, this.h);
	}

}

function Population(){
	this.rockets = [];
	this.popsize = populationSize;
	this.matingPool = [];
	this.bestTimeBatch = lifespan;
	this.mutationRate = 1;
	this.alive = this.popsize;
	this.crashedRockets = 0;
	this.hatedPoints = [];

	for(var i = 0; i < this.popsize; i++){
		this.rockets[i] = new Rocket();
	}

	this.evaluate = function(){
		//console.log(population.crashedRockets);
		mostHatedPoint[0] /= population.crashedRockets;
		mostHatedPoint[1] /= population.crashedRockets;
		mostHatedPoint[0] = int(mostHatedPoint[0]);
		mostHatedPoint[1] = int(mostHatedPoint[1]);
		if(this.mutationRate>1 && (generations%5 == 0)){
			var point = {
				x: mostHatedPoint[0],
				y: mostHatedPoint[1]
			};
			this.hatedPoints.push(point);
			if(this.hatedPoints.length > 4){
				this.hatedPoints.splice(0, 1);
			}
		}
		//console.log(mostHatedPoint);
		//console.log(mostHatedPoint[0]);
		var maxfit = 0;
		if(pathfinder != undefined && bestTime == lifespan){
			pathfinder.fitness *= 1000;
		}

		//console.log(pathfinder);
		for(var i = 0; i < this.popsize; i++){
			this.rockets[i].calcFitness();
			// if(this.rockets[i] == pathfinder){
			// 	this.rockets[i].fitness *= 100;
			// }
			if(this.rockets[i].fitness > maxfit){
				maxfit = this.rockets[i].fitness;
				//console.log(maxfit);


			}
		}

		for(var i = 0; i < this.popsize; i++){
			this.rockets[i].fitness /= maxfit;
			//console.log(this.rockets[i].fitness);
		}

		this.matingPool = [];
		for(var i = 0; i < this.popsize; i++){
			var n = int(this.rockets[i].fitness * 100);
			for(var j = 0; j < n; j++){
				this.matingPool.push(this.rockets[i]);
			}
		}
		mostHatedPoint[0] = 0;
		mostHatedPoint[1] = 0;
		furthestDistance = diagonalLength;
		//console.log(this.matingPool);
	}

	this.selectioning = function(){
		var newRockets = [];
		//console.log(this.rockets);
		for(var i = 0; i < this.rockets.length; i++){
			var parentA = random(this.matingPool).dna;
			var parentB = random(this.matingPool).dna;
			var child = parentA.crossover(parentB);
			child.mutation();
			newRockets[i] = new Rocket(child);
		}
		this.rockets = newRockets;
	}

	this.changeMutationRate = function(val){
		if(this.mutationRate < mutalimit){
			this.mutationRate += val;
			console.log('Changed mutation rate ' + this.mutationRate);
		}

	}

	this.checkImprovement = function(){
		var sum = 0;
		for(var i = 0; i < this.popsize; i++){
			if(this.rockets[i].completed == false){
				sum++;
			}
		}

		if(sum == this.popsize){
			generationsIncomplete++;
		}

		if((generationsIncomplete > 30) && (generations - lastImproved > 5)){
			this.changeMutationRate(1);
			generationsIncomplete = 20;
		}
	}


	this.run = function(){
		for(var i = 0; i < this.popsize; i++){
			this.rockets[i].update();
			if(skipping == false){
				this.rockets[i].show();
			}
		}
	}
}


function DNA(genes){
	if(genes){
		this.genes = genes;
	} else {
	this.genes = [];
	for (var i = 0; i < lifespan; i++){
		this.genes[i] = p5.Vector.random2D();
		this.genes[i].setMag(maxforce);
	}
}

	this.crossover = function(partner){
		var newgenes = [];
		var mid = floor(random(this.genes.length));
		for(var i = 0; i < this.genes.length; i++){
				if(i > mid){
					newgenes[i] = this.genes[i];
				} else {
					newgenes[i] = partner.genes[i];
				}

	}
	return new DNA(newgenes);
}

	this.mutation = function(){

			for(var i = 0; i < this.genes.length; i++){
				if(random(1) < population.mutationRate / 100){
					this.genes[i] = p5.Vector.random2D();
					this.genes[i].setMag(maxforce);
					}
				}
			}

}

function Rocket(lastdna) {

	this.pos = spawnPoint.copy(); //Need to copy object, otherwise it is referenced

	this.vel = createVector();
	this.acc = createVector();
	this.completed = false;
	this.crashed = false;
	this.time = 0;
	if(lastdna){
		this.dna = lastdna;
	} else {
		this.dna = new DNA();
	}
	this.fitness = 0;


	this.applyForce = function(force) {
		this.acc.add(force);
		//console.log(this.pos)
	}

	this.calcFitness = function(){
			var d = dist(this.pos.x, this.pos.y, target.x, target.y);
			this.fitness = map(d, 0, diagonalLength, diagonalLength, 1);
			this.fitness *= this.fitness;
			if(this.completed){
				this.fitness += map(this.time, 0, lifespan, 30, 0);
				this.fitness *= map(this.time, population.bestTimeBatch, lifespan, 3, 1);
				if(this.time == population.bestTimeBatch){
					this.fitness *= 3;
				}
				if(this.time == bestTime){
					this.fitness *= 1000;
					bestADNnow = this.dna.genes;
					//console.log(bestADNnow);
					lastImproved = generations;
				}
			}
			if((population.mutationRate > 2)){
				var badD;
				var myPoint = population.hatedPoints[population.hatedPoints.length-1];
				print(point);
				badD = dist(this.pos.x, this.pos.y, myPoint.x, myPoint.y);
				if(badD < furthestDistance){
					pathfinder = this;
				}

				if(this.crashed){
					this.fitness /= 10;
				}
			}
			if(this.crashed){
				this.fitness /= 10;
			}


	}

	this.update = function() {

		var d = dist(this.pos.x, this.pos.y, target.x, target.y);
		if(d < 10 && !this.completed){
			this.completed = true;
			this.pos = target.copy();
			this.time = count;
			population.alive--;
			if(this.time < population.bestTimeBatch){
				population.bestTimeBatch = this.time;
			}
			if(this.time < bestTime){
				lastImproved = generations;
				bestTime = this.time;
				population.mutationRate = 1;
				generationsIncomplete = 0;
			}
		}

		if(d < bestDistance){
			bestDistance = d;
			lastImproved = generations;
			if(population.mutationRate > 1){
				population.changeMutationRate(-1);
			}
		}

		if(!this.crashed){
			for(i = 0; i < wallList.length; i++){
	 		 	wall = wallList[i];

				if(this.pos.x > wall.x && this.pos.x < wall.x + wall.w && this.pos.y > wall.y && this.pos.y < wall.y + wall.h){
					this.crashed = true;
					break;
				}
			}
				if(this.pos.x > width || this.pos.x < 0){
					this.crashed = true;
				}
				if(this.pos.y > height || this.pos.y < 0){
					this.crashed = true;
				}
				if(this.crashed){
					population.alive--;
					population.crashedRockets++;
					mostHatedPoint[0] += this.pos.x;
					mostHatedPoint[1] += this.pos.y;
				}
		}


		this.applyForce(this.dna.genes[count])
		if(!this.completed && !this.crashed){
			this.vel.add(this.acc);
			this.pos.add(this.vel);
			this.acc.mult(0);
			this.vel.limit(maxSpeed);
		}
	}

	this.show = function(){
		push();
		noStroke();
		fill(255, 100);
		translate(this.pos.x, this.pos.y);
		rotate(this.vel.heading());
		rectMode(CENTER);
		rect(0, 0, 25, 5);
		pop();
	}
}
