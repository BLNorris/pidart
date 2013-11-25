

function fitText() {
    var divisors = [4, 6, 12, 18];
    //if ($(window).height() < $(window).width()) {
	for (var d in divisors) {
	    $( '.fit-height-body-' + divisors[d] ).each(function ( i, box ) {
		$(box).css('font-size', $(window).height()/divisors[d]);
	    });
	}
    //} else {
	for (var d in divisors) {
	    $( '.fit-width-body-' + divisors[d] ).each(function ( i, box ) {
		$(box).css('font-size', $(window).height()/divisors[d]);
	    });
	}
    //}
}

var eloEngine = new function(){
    var EloK = 16;
    var EloInitR = 1500;
    var LOSS = 0;
    var WON = 1;
    var DRAW = 0.5;

    function elo_exp (ra, rb) {
	return 1.0 / (1 + Math.pow(10, (rb-ra)/400.0));
    }

    function transform (ranking) {
	var game = {};
	$.each(ranking, function(index, info) {
	    var player = info['name'];
	    var against = {};
	    $.each(ranking, function(index2, info2) {
		var opponent = info2['name'];
		if (player === opponent) {
		    return;
		}
		if (info['rank'] == info2['rank']) {
		    against[opponent] = DRAW;
		} else if (info['rank'] < info2['rank']) {
		    against[opponent] = WON;
		} else {
		    against[opponent] = LOSS;
		}
		console.debug("ELO: " + info['name'] + " vs. " + info2['name'] + ": " + against[opponent]);
	    });
	    game[player] = against;
	});
	console.debug(game);
	return game;
    }

    function compute_ratings(old_ratings, game) {
	var new_ratings = $.extend(true, {}, old_ratings);
	$.each(game, function(playerA, results) {
	    var ra = (typeof(old_ratings[playerA]) === 'undefined')
		? EloInitR
		: old_ratings[playerA];
	    var sum = 0;
	    var exp_sum = 0;
	    $.each(results, function (playerB, result) {
		sum += result;
		var rb = (typeof(old_ratings[playerB]) === 'undefined') ? EloInitR : old_ratings[playerB];
		exp_sum += elo_exp(ra, rb);
	    });
	    var new_ra = ra + EloK * (sum - exp_sum);
	    console.debug("ELO for player " + playerA + " was " + new_ratings[playerA] + " -> " + new_ra);
	    new_ratings[playerA] = new_ra;
	});
	return new_ratings;
    }

    this.calc = function(old_ratings, ranking) {
	return compute_ratings(old_ratings, transform(ranking));
    }

};


$(window).resize(function() {
    fitText()
});

$(document).ready(function() {
    fitText()
});

angular.module('darts', ['googlechart', 'ngDragDrop']).controller('DartCtrl', function ($scope, $timeout, $filter) {
    $scope.state = {};
    $scope.availablePlayers = [];
    $scope.selectedPlayers = [];
    $scope.latestScores = {};
    $scope.usualSuspects = ['DF', 'ES', 'GS', 'OC', 'RK', 'TT'];
    $scope.playersInChart = [];
    $scope.initialValue = 301;

    var history = {};
    history.type="LineChart";
//    history.displayed = false;
//    history.cssStyle = "";
    history.data = {};
    history.options = {
        "isStacked": "false",
        "fill": 20,
        "displayExactValues": false,
        "vAxis": {
            "title": "ELO points", "gridlines": {"count": 5}
        },
        "hAxis": {
            "title": "Date"
        },
	containerId: "mychart"
    };

    $scope.chart = history;

    /*$scope.chartReady = function () {
        fixGoogleChartsBarsBootstrap();
    }

    function fixGoogleChartsBarsBootstrap() {
        $(".google-visualization-table-table img[width]").each(function (index, img) {
            $(img).css("width", $(img).attr("width")).css("height", $(img).attr("height"));
        });
    };*/

    var wsuri = window.location.href.replace(/^http(s?:\/\/.*):\d+\/.*$/, 'ws$1:8080/websocket');
    $scope.sock = new ReconnectingWebSocket(wsuri);

    $(document).ready(function() {
	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	    if (e.target.hash == '#stats') {
		$scope.$emit('resizeMsg');
	    }
	});
    });

    $scope.sock.onopen = function() {
	console.log("Connected to " + wsuri);
	$scope.sock.send("hello");
    }

    $scope.sock.onclose = function(e) {
	console.log("Connection closed (wasClean = " + e.wasClean + ", code = " + e.code + ", reason = '" + e.reason + "')");
	$scope.state.state = 'connlost';
	$scope.$apply();
	fitText();
    }

    $scope.sock.onmessage = function(e) {
	console.log("Got message: " + e.data);
	var newState = JSON.parse(e.data);
	var oldPlayers = typeof($scope.state.players) === 'undefined' ? null : $scope.state.players.join();
	var newPlayers = typeof(newState.players) === 'undefined' ? null : newState.players.join();
	$scope.state = $.extend($scope.state, newState);
	if (oldPlayers != newPlayers || newState.state == 'null') {
	    $scope.updateChartFull();
	} else if (typeof(newState.ranking) !== 'undefined') {
	    $scope.updateChartRanking(true);
	}
	$scope.$apply();
	fitText();
    }

    $scope.skipPlayer = function(player) {
	$scope.sock.send("cmd:skip-player " + player);
    }
	
    $scope.newGame = function() {
	if ($scope.selectedPlayers.length < 2) {
	    alert("Please select at least two players.");
	    return;
	}
	if ($scope.state.state != 'gameover' && $scope.state.state != 'null') {
	    if (! confirm("Do you want to cancel the current game?")) {
		return;
	    }
	}
	$scope.selectedPlayers.sort(function (a, b) {
	    return ((a.rank < b.rank) ? -1 : ((a.rank > b.rank) ? 1 : 0));
	});
	var players = [];
	for (var i = 0; i < $scope.selectedPlayers.length; i ++) {
	    players.push($scope.selectedPlayers[i].name);
	}
	$scope.sock.send("cmd:new-game " + players.join(',') + " " + $scope.initialValue);
    };

    $scope.updateChartFull = function() {
	$.ajax('http://infsec.uni-trier.de/dartenbank/rpc/elo.php?count=30', {
	    dataType: 'JSON'
	})
	    .done(function(data) {
		$scope.playersInChart = $.merge([], $scope.usualSuspects);
		$.each($scope.state.players, function (i, name) {
		    if ($scope.playersInChart.indexOf(name) === -1) {
			$scope.playersInChart.push(name);
		    }
		});
		console.log("Updating chart.");
		$scope.chart.data.cols = [];
		$scope.chart.data.rows = [];
		$scope.chart.data.cols.push({
		    id: 'date',
		    label: 'Date',
		    type: 'string'
		});
		$.each($scope.playersInChart, function (i, name) {
		    $scope.chart.data.cols.push({
			id: name,
			label: name,
			type: 'number'
		    });
		});

		$.each(data, function(date, scores) {
		    $scope.chart.data.rows.push(
			$scope.getChartRowFromRatings(
			    date.split(' ')[0],
			    scores
			)
		    );
		    $scope.latestScores = scores;
		});
		$scope.updateChartRanking(false);
		$scope.updateAvailablePlayers();
	    });
    };

    $scope.updateChartRanking = function(replace) {
	if (replace) {
	    $scope.chart.data.rows.pop();
	}
	var todaysRanking = eloEngine.calc($scope.latestScores, $scope.state.ranking);
	$scope.chart.data.rows.push(
	    $scope.getChartRowFromRatings(
		'today',
		todaysRanking
	    )
	);
	//$scope.$apply();
    };

    $scope.getChartRowFromRatings = function(date, ratings) {
	var currentRow = [{v: date}];
	$.each($scope.playersInChart, function(i, player) {
	    if (player in ratings) {
		currentRow.push({v: Math.round(ratings[player])});
	    } else {
		currentRow.push({});
	    }
	});
	return {c: currentRow};
    };


    $('#refresh').click(function() {
	$scope.updateChartFull();
    });

    $scope.sortSelectedPlayers = function() {
	return $filter('orderBy')($scope.selectedPlayers, '-games');
    };

    $scope.updateAvailablePlayers = function() {
	$.ajax('http://infsec.uni-trier.de/dartenbank/rpc/get-players.php', {
	    dataType: 'JSON'
	})
	    .done(function(data) {
		$scope.availablePlayers = [];
		$.each(data, function(name, games) {
		    var rank = 1500;
		    if (typeof($scope.latestScores[name]) != 'undefined') {
			rank = $scope.latestScores[name];
		    }
		    $scope.availablePlayers.push({name: name, games: games, rank:rank});
		});
	    });
    };

    $scope.addPlayer = function() {
	if ($scope.newPlayerName.length < 2 || $scope.newPlayerName.length > 3) {
	    alert("Player name must have 2 or 3 characters.");
	    return;
	}
	$.each($scope.availablePlayers, function(i, data) {
	    if (data.name == $scope.newPlayerName) {
		alert("Player name already exists.");
		return;
	    }
	});
	$scope.availablePlayers.push({name: $scope.newPlayerName, games: 0, rank:0});
    };
});
