var Game = {
	rows: 16,
	cols: 9,
	tileSize: 20,
	borderSize: 5,
}

Game.offset = Game.tileSize + Game.borderSize;
Game.w = Game.rows * Game.offset + Game.borderSize;
Game.h = Game.cols * Game.offset + Game.borderSize;

var Utils = {
	randInt: function(n){
		return Math.floor(Math.random() * n);
	},
}

Crafty.c("Cell", {
	tileSize: Game.tileSize,
	borderSize: Game.borderSize,
	offset: Game.tileSize + Game.borderSize,
	init: function() {
		this.requires("2D, DOM, Color, Tween, Persist");
		this.attr({w: this.tileSize, h: this.tileSize});
	},
	at: function(x, y) {
		this.attr({
			x: this.borderSize + this.offset * x,
			y: this.borderSize + this.offset * y,
		});
		return this;
	},
	tweenColor: function(color) {
		var _this = this;
		var delta = 400;
		this.tween({h: 0, alpha: 0}, delta)
		.one("TweenEnd", function(){
			this.color(color);
			this.tween({h: this.tileSize, alpha: 1}, delta);
		});
	},
});

Crafty.c("Grid", {
	backgroundColor: "#aaaaaa",
	grid: function(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.cells = {};
		this._createCells();
		this.clearGrid();
		return this;
	},
	at: function(x, y) {
		return this.cells[this._key(x, y)];
	},
	clearGrid: function() {
		this.trigger("StopFlipping");
		var maxDelay = 0;
		for (var x = 0; x < this.rows; x++) {
			for (var y = 0; y < this.cols; y++) {
				var delay = this._delayedTweenColor(x, y);
				maxDelay = Math.max(maxDelay, delay);
			};
		};
		var self = this;
		Crafty.e("Delay").delay(function(){
			self.trigger("Ready");
			self.trigger("StartFlipping");
		}, maxDelay + 800, 0);
	},
	colorAt: function(x, y, color) {
		this.at(x, y).tweenColor(color);
	},
	resetColorAt: function(x, y) {
		this.at(x, y).tweenColor(this.backgroundColor);
	},
	_createCells: function() {
		for (var x = 0; x < this.rows; x++) {
			for (var y = 0; y < this.cols; y++) {
				this.cells[this._key(x, y)] = Crafty.e("Cell").at(x, y);
			};
		};
	},
	_key: function(x, y) {
		return "" + x + ", " + y;
	},
	_delayedTweenColor: function(x, y) {
		var delay = 100*x + 100*y;
		var self = this;
		Crafty.e("Delay").delay(function() {
			self.resetColorAt(x, y);
		}, delay, 0);
		return delay;
	},
});

Crafty.c("RandomFlipper", {
	init: function() {
		this.requires("Delay");
	},
	grid: function(grid) {
		if (grid === undefined) {
			return this._grid;
		};
		this._grid = grid;
		this._grid.bind("StartFlipping", this.startFlipping.bind(this));
		this._grid.bind("StopFlipping", this.stopFlipping.bind(this));
		return this;
	},
	flipRandomCell: function() {
		var x = Utils.randInt(this._grid.rows);
		var y = Utils.randInt(this._grid.cols);
		var red = Utils.randInt(256);
		var green = Utils.randInt(256);
		var blue = Utils.randInt(256);
		var rgb = "rgb(" + red + "," + green + "," + blue + ")";
		this._grid.at(x, y).tweenColor(rgb);
	},
	startFlipping: function() {
		this.delay(this.flipRandomCell, 50, -1);
	},
	stopFlipping: function() {
		this.cancelDelay(this.flipRandomCell);
	},
	remove: function() {
		this.stopFlipping();
	},
});

Crafty.c("ClearOnSpace", {
	init: function() {
		this.requires("Grid, Keyboard");
		this.bind("KeyDown", function() {
			if (this.isDown("SPACE")) {
				this.clearGrid();
			};
		});
	},
});

Crafty.c("Snake", {
	color: "#ee0000",
	init: function() {
		this.requires("Delay");
		this._segments = [];
	},
	snake: function(grid, x, y, dir, maxLen) {
		this._grid = grid;
		this._segments[0] = {x: x, y: y};
		this._dir = dir;
		this._maxLen = maxLen;
		this._grid.bind("StartFlipping", this.startMoving.bind(this));
		this.bind("OutOfBounds", this.stopMoving);
	},
	startMoving: function() {
		var head = this.head();
		this._grid.colorAt(head.x, head.y, this.color);
		this.delay(this.move, 1000, -1);
	},
	stopMoving: function() {
		this.cancelDelay(this.move);
	},
	move: function() {
		var head = this.head();
		var new_segment = {x: head.x + 1, y: head.y};
		if (this._grid.at(new_segment.x, new_segment.y) === undefined) {
			this.trigger("OutOfBounds");
			return;
		};
		this._grid.colorAt(new_segment.x, new_segment.y, this.color);
		this._segments.push(new_segment);
		if (this._segments.length > this._maxLen) {
			var old = this._segments.shift();
			this._grid.resetColorAt(old.x, old.y);
		};
	},
	head: function() {
		return this._segments[this._segments.length - 1];
	},
});

Crafty.scene("MainMenu", function() {
	var rf = Crafty.e("RandomFlipper").grid(Game.grid);
	Crafty.e("Keyboard").bind("KeyDown", function() {
		if (this.isDown("A")) {
			rf.destroy();
			Crafty.scene("SnakeGame");
		};
	});
});

Crafty.scene("SnakeGame", function() {
	var snake = Crafty.e("Snake").snake(Game.grid, 3, 4, "right", 5);
});

window.onload = function() {
	console.log("Starting Snake Beat...");
	Crafty.init(Game.w, Game.h);
	Crafty.background("#000000");
	Game.grid = Crafty.e("Grid").grid(Game.rows, Game.cols);
	Game.grid.addComponent("ClearOnSpace");
	Crafty.scene("SnakeGame");
};
