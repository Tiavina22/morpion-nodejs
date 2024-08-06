const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serveur des fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

let rooms = {}; // Stocke les informations des salles de jeu

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Nouvelle connexion établie:', socket.id);

    // Création d'une nouvelle salle de jeu
    socket.on('createRoom', ({ roomName, password }) => {
        if (!rooms[roomName]) {
            // Si la salle n'existe pas, la créer avec le joueur initial (Équipe O)
            rooms[roomName] = { 
                password, 
                players: [{ id: socket.id, team: 'O' }], 
                grid: ['', '', '', '', '', '', '', '', ''], 
                turn: 'X' 
            };
            socket.emit('roomCreated', { room: roomName, team: 'O' });
            socket.emit('playerNumber', { team: 'O' }); // Émettre le numéro du joueur
            socket.join(roomName); // Joindre la salle
        } else {
            socket.emit('roomFull'); // Salle déjà existante
        }
    });

    // Détection de la fin de la partie
    socket.on('gameOver', (winner) => {
        alert(winner === 'draw' ? "Match nul!" : `${winner} a gagné!`);
        document.getElementById('board').style.display = 'none';
        document.getElementById('create-room').style.display = 'block';
        document.getElementById('join-room').style.display = 'block';
        document.getElementById('turn-display').classList.add('hidden');
        socket.emit('leaveRoom', player.room); // Quitter la salle
    });

    // Rejoindre une salle existante
    socket.on('joinRoom', ({ roomName, password }) => {
        const room = rooms[roomName];
        if (room) {
            if (room.password === password) {
                if (room.players.length < 2) {
                    // Ajouter le joueur à la salle avec l'équipe X
                    const newTeam = 'X'; 
                    room.players.push({ id: socket.id, team: newTeam });
                    socket.emit('joinedRoom', { room: roomName, team: newTeam });
                    socket.emit('playerNumber', { team: newTeam }); // Émettre le numéro du joueur
                    socket.join(roomName); // Joindre la salle
                } else {
                    socket.emit('roomFull'); // Salle déjà pleine
                }
            } else {
                socket.emit('invalidPassword'); // Mot de passe incorrect
            }
        } else {
            socket.emit('roomFull'); // Salle n'existe pas
        }
    });

    // Gestion des mouvements des joueurs
    socket.on('playerMove', ({ room, index, team }) => {
        const game = rooms[room];
        if (game && game.turn === team && game.grid[index] === '') {
            game.grid[index] = team;
            game.turn = team === 'X' ? 'O' : 'X'; // Changer le tour
            io.in(room).emit('updateGrid', game.grid); // Mettre à jour la grille
            io.in(room).emit('updateTurn', game.turn); // Mettre à jour le tour

            const winner = checkWinner(game.grid); // Vérifier le gagnant
            if (winner) {
                io.in(room).emit('gameOver', winner); // Annonce de la fin de la partie
                rooms[room] = { password: game.password, players: [], grid: ['', '', '', '', '', '', '', '', ''], turn: 'X' }; // Réinitialiser la salle
            }
        }
    });

    // Gestion de la déconnexion des joueurs
    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté:', socket.id);
        for (const room in rooms) {
            const game = rooms[room];
            const index = game.players.findIndex(player => player.id === socket.id);
            if (index !== -1) {
                game.players.splice(index, 1); // Retirer le joueur de la salle
                if (game.players.length === 0) {
                    delete rooms[room]; // Supprimer la salle si vide
                } else {
                    io.in(room).emit('updateGrid', game.grid); // Mettre à jour la grille pour les autres joueurs
                    io.in(room).emit('updateTurn', game.turn); // Mettre à jour le tour pour les autres joueurs
                }
            }
        }
    });

});

// Fonction pour vérifier le gagnant
function checkWinner(grid) {
    const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
            return grid[a]; // Retourne le gagnant (X ou O)
        }
    }

    return grid.includes('') ? null : 'draw'; // Retourne 'draw' si la grille est pleine et aucun gagnant
}

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
