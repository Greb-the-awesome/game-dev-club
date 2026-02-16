var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var w = canvas.clientWidth; var h = canvas.clientHeight;

const INITIAL = 
`
00000000000000000000000000000000000000000
00000000000000000000000010000000000000000
00000000000000000000001010000000000000000
00000000000011000000110000000000001100000
00000000000100010000110000000000001100000
11000000001000001000110000000000000000000
11000000001000101100001010000000000000000
00000000001000001000000010000000000000000
00000000000100010000000000000000000000000
00000000000011000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
00000000000000000000000000000000000000000
`
var arr = INITIAL.split("\n");
for (var i=0; i<arr.length; i++) {
    arr[i] = arr[i].split("");
}
arr.shift(); arr.pop();
var gridWidth = arr[0].length;
var gridHeight = arr.length;

function progress() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    var newArr = JSON.parse(JSON.stringify(arr));
    for (var y=0; y<gridHeight; y++) {
        for (var x=0; x<gridWidth; x++) {
            if (arr[y][x] == "1") {
                ctx.fillStyle = "#000000";
            } else {ctx.fillStyle = "#AAAAAA";}
            ctx.fillRect(x*10, y*10, 10, 10);
            var neighbors = 0;
            
            for (var dx=-1; dx<=1; dx++) {
                for (var dy=-1; dy<=1; dy++) {
                    if (dx || dy) {
                        if (arr[y+dy] && arr[y+dy][x+dx] == "1") {
                            neighbors++;
                        }
                    }
                }
            }

            if (neighbors < 2) {newArr[y][x] = "0";}
            if (neighbors > 3) {newArr[y][x] = "0";}
            if (neighbors == 3) {newArr[y][x] = "1";}
        }
    }
    arr = newArr;
}

setInterval(progress, 100);
