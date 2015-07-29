$(document).ready(function () {
   $('#chose-level').addClass('animated fadeInDown');
});

var btn = document.getElementById('btn');
$('#btn').addClass('animated pulse');
$('#team-logo').addClass('animated flash');

var levels = document.getElementById('level-menu');

var rows, cols;
var someSocket = io();

$('.level').on('click', function(){
    $('.level').removeClass('level-chosen');
    $(this).addClass('level-chosen');
    var difficult = $(this).data('level');
    someSocket.emit('difficulty', difficult);
});

someSocket.on('difficulty', function (diff) {
    switch (diff) {
        case 'e':
            rows = 8;
            cols = 8;
            break;
        case 'm':
            rows = 11;
            cols = 11;
            break;
        case 's':
            rows = 14;
            cols = 14;
            break;
    }
});

btn.addEventListener('click', function () {
    someSocket.emit('set up game', null);
});

someSocket.on('set up game', function () {
    $('#chat-minimized').removeClass('hidden');
    $('#svg-container').removeClass('hidden');
    $('#chose-level').addClass('hidden');
    $('#lightningcanvas').removeClass('hidden');

    var paper = Raphael('svg-container', 600, 600);

    var players = [{
        color: 'red',
        points: 0
    }, {
        color: 'blue',
        points: 0
    }];

    $('#chat-minimized').on('click', function () {
        $('#container').removeClass('hidden').addClass('animated fadeInUp');
        $('#chat-minimized').addClass('hidden');
    });

    $('h1').on('click', function (){
        $('#container').addClass('animated fadeInDown').addClass('hidden');
        $('#chat-minimized').removeClass('hidden');
    })

    var playersCount = players.length;
    var currentPlayerTurn = 0;
    var isPlayerAgain = false;

    var pointsContainer = document.getElementById('points-container');
    var firstPlayerPointsSpan = document.createElement('span');
    var secondPlayerPointsSpan = document.createElement('span');
    firstPlayerPointsSpan.style.display = 'block';
    firstPlayerPointsSpan.style.color = 'red';
    secondPlayerPointsSpan.style.display = 'block';
    secondPlayerPointsSpan.style.color = 'blue';

    pointsContainer.appendChild(firstPlayerPointsSpan);
    pointsContainer.appendChild(secondPlayerPointsSpan);

    var showPoints = (function showPoints() {
        firstPlayerPointsSpan.innerText = players[0].color + ': ' + players[0].points;
        secondPlayerPointsSpan.innerText = players[1].color + ': ' + players[1].points;
        //console.log(players[0].color, players[0].points);
        //console.log(players[1].color, players[1].points);
    });
    showPoints();

    var squares = [];

    var socket = io();
    var currentLineId = -1;

    //emitting chat's messages
    $('form').submit(function () {
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });
    socket.on('chat message', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
    //--- end of emitting chat's messages

    generateGrid(paper, rows, cols);
    generateIds(squares, rows, cols);

    (function socket(socket, currentLineID) {

        function mouseOver() {
            $(this).attr({ stroke: '#53533F' });
            $(this).attr({ 'stroke-width': '5' });
            //console.log($(this).attr('id'));
        }

        function mouseOut() {
            $(this).attr({ stroke: 'lightgray' });
            $(this).attr({ 'stroke-width': '4' });
        }

        function clicked() {
            $(this).attr({ stroke: 'black' });
            $(this).attr({ 'stroke-width': '5' });
            $(this).unbind("mouseover", mouseOver);
            $(this).unbind("mouseout", mouseOut);

            currentLineID = +($(this).attr('id'));
            //console.log(currentLineID);

            socket.emit('id', currentLineID);

            socket.on('id', function (id) {
                addLineToSquare(id);
            });

            if (!isPlayerAgain) {
                currentPlayerTurn++;
            }
            else {
                isPlayerAgain = false;
            }

            if (currentPlayerTurn === playersCount) {
                currentPlayerTurn = 0;
            }
            socket.emit('player turn', currentPlayerTurn);
        }

        socket.on('player turn', function (turn) {
            currentPlayerTurn = turn;
            //console.log('in socket: ', currentPlayerTurn);
        });
        //console.log('after socket: ', currentPlayerTurn);

        socket.emit('id', currentLineID);

        socket.on('id', function (id) {
            addLineToSquare(id);
        });

        function addLineToSquare(id) {
            squares.forEach(function (currentSquare) {

                if (!currentSquare.lines.length) {
                    return;
                }

                var indexOfId = currentSquare.lines.indexOf(id);

                if (indexOfId >= 0) {
                    //console.log(currentSquare);
                    currentSquare.lines.splice(indexOfId, 1);
                    //console.log(currentSquare);

                    $('#' + id).unbind("mouseover", mouseOver);
                    $('#' + id).unbind("mouseout", mouseOut);
                    $('#' + id).attr({ stroke: 'black' });
                    $('#' + id).attr({ 'stroke-width': '5' });
                }

                if (!currentSquare.lines.length) {
                    // THE SQUARE HAS ALL SIDES FILLED, NEED TO CONTINUE THE LOGIC
                    var currentTopLineId = currentSquare.topLineId;

                    var $currentLine = $('#' + currentTopLineId);
                    var $position = $currentLine.position();

                    var x = $position.left;
                    var y = $position.top;

                    //alert('x: ' + x + ' y: ' + y);
                    var rectToFill = paper.rect(x, y, 40, 40);

                    var colorToUse = players[currentPlayerTurn].color;

                    socket.emit('rect color', colorToUse);

                    socket.on('rect color', function (color) {
                        if (rectToFill.attr('fill') == 'none') {
                            rectToFill.attr({
                                fill: color
                            });
                        }
                    });

                    players[currentPlayerTurn].points++;

                    showPoints();

                    isPlayerAgain = true;

                    //console.log(currentSquare);
                    //console.log(id);
                }
            });
        }

        $('div svg path')
            .mouseover(mouseOver)
            .mouseout(mouseOut)
            .click(clicked);

    }(socket, currentLineId));
});
