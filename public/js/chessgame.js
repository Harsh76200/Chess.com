const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const turnIndicator = document.getElementById("turnIndicator");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            })
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    // Ensure board flipping logic is applied correctly
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: '♚', // Black King
        K: '♔', // White King
        q: '♛', // Black Queen
        Q: '♕', // White Queen
        r: '♜', // Black Rook
        R: '♖', // White Rook
        b: '♝', // Black Bishop
        B: '♗', // White Bishop
        n: '♞', // Black Knight
        N: '♘', // White Knight
        P: '♙', // White Pawn
        p: '♟', // Black Pawn
    };

    return unicodePieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase()] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
    updateTurnIndicator();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
    updateTurnIndicator();
});

const updateTurnIndicator = () => {
    turnIndicator.textContent = chess.turn() === 'w' ? "White's Turn(player 1)" : "Black's Turn(player 2)";
};

renderBoard();
