// script.js
const initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';
let selectedSquare = null;

function startGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'white';
    selectedSquare = null;
    renderBoard();
    updateStatus();
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;
            square.innerText = board[row][col] !== ' ' ? board[row][col] : '';
            square.onclick = () => handleSquareClick(row, col);
            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare;
        if (isValidMove(selectedRow, selectedCol, row, col)) {
            makeMove(selectedRow, selectedCol, row, col);
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            updateStatus();
        }
        selectedSquare = null;
    } else {
        if (board[row][col] !== ' ' && isPlayerPiece(row, col)) {
            selectedSquare = [row, col];
        }
    }
    renderBoard();
}

function isValidMove(fromRow, fromCol, toRow, toCol) {
    // Hier kommen die Schachregeln für die Bewegungen der Figuren
    // Für den Anfang nehmen wir an, dass alle Züge gültig sind
    return true;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = ' ';
}

function isPlayerPiece(row, col) {
    const piece = board[row][col];
    return (currentPlayer === 'white' && piece === piece.toUpperCase()) ||
           (currentPlayer === 'black' && piece === piece.toLowerCase());
}

function updateStatus() {
    const statusElement = document.getElementById('status');
    statusElement.innerText = `Spieler am Zug: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`;
}

function toggleMode() {
    // Funktion zum Wechseln zwischen verschiedenen Spielmodi
    alert('Modus wechseln ist noch nicht implementiert.');
}

startGame();
