const express = require('express')
const app = express()
const socket = require('socket.io')
const http = require('http')
const path = require('path')
const { resourceUsage } = require('process')
const {Chess} = require('chess.js')
const { on } = require('events')

app.set("view engine" , "ejs")
app.use(express.static(path.join(__dirname,'public')))

const server = http.createServer(app)
const io = socket(server)

const chess = new Chess()

let players = {}
let currentPlayer = "w"

io.on("connection" , function(uniquesocket){
    console.log("Connected")

    // uniquesocket.on("churan",function(){
    //     io.emit("Churan papadi sent to all")
    // })

    if(!players.white){
        players.white = uniquesocket.id
        uniquesocket.emit("playerRole","w")
    }else if(!players.black){
        players.black = uniquesocket.id
        uniquesocket.emit("playerRole","b")
    }else{
        uniquesocket.emit("spectetorRole")
    }

    //if any player disconnected for any reason
    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white
        }else if(uniquesocket.id === players.black){
            delete players.black
        }
        console.log("disconnected")
    })

    //to handle user moves
    uniquesocket.on("move", (move) => {
        try {
            // Ensure the player is allowed to make the move
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;
    
            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", { move });
            }
        } catch (error) {
            console.log(error);
            uniquesocket.emit("invalidMove", { move, error: error.message });
        }
    });
    


})
app.get("/",function(req,res){
    res.render("index",{title : "Chess.com"})
})


server.listen(3000, () => {
    console.log('Server running on port 3000');
});
