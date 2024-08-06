const socket = io(); // Connexion au serveur Socket.IO
let player = { team: null, room: null }; // Informations sur le joueur (équipe et salle)

// Fonction pour créer une nouvelle partie
function createRoom() {
    const roomName = document.getElementById('createRoomName').value;
    const password = document.getElementById('createRoomPassword').value;
    if (roomName && password) {
        // Émettre l'événement de création de salle au serveur
        socket.emit('createRoom', { roomName, password });
    } else {
        alert("Veuillez entrer un nom de partie et un mot de passe."); // Message d'erreur si les champs sont vides
    }
}

// Fonction pour rejoindre une partie existante
function joinRoom() {
    const roomName = document.getElementById('joinRoomName').value;
    const password = document.getElementById('joinRoomPassword').value;
    if (roomName && password) {
        // Émettre l'événement de rejoindre une salle au serveur
        socket.emit('joinRoom', { roomName, password });
    } else {
        alert("Veuillez entrer un nom de partie et un mot de passe."); // Message d'erreur si les champs sont vides
    }
}

// Événement déclenché lorsque la salle est créée avec succès
socket.on('roomCreated', ({ room, team }) => {
    player.team = team;
    player.room = room;
    player.number = team === 'O' ? 'X' : 'Y'; // Déterminer le numéro du joueur
    document.getElementById('turn-display').classList.remove('hidden'); // Afficher l'affichage du tour
    updateTurnDisplay(); // Mettre à jour l'affichage du tour
    document.getElementById('create-room').style.display = 'none'; // Masquer le formulaire de création de salle
    document.getElementById('join-room').style.display = 'none'; // Masquer le formulaire de rejoindre une salle
    document.getElementById('board').style.display = 'grid'; // Afficher le plateau de jeu
});

// Événement déclenché lorsque le joueur rejoint une salle avec succès
socket.on('joinedRoom', ({ room, team }) => {
    player.team = team;
    player.room = room;
    player.number = team === 'O' ? '1X' : 'Y'; // Déterminer le numéro du joueur
    document.getElementById('turn-display').classList.remove('hidden'); // Afficher l'affichage du tour
    updateTurnDisplay(); // Mettre à jour l'affichage du tour
    document.getElementById('create-room').style.display = 'none'; // Masquer le formulaire de création de salle
    document.getElementById('join-room').style.display = 'none'; // Masquer le formulaire de rejoindre une salle
    document.getElementById('board').style.display = 'grid'; // Afficher le plateau de jeu
});

// Événement déclenché lorsque la salle est pleine
socket.on('roomFull', () => {
    alert("La salle est pleine."); // Message d'erreur si la salle est pleine
});

// Événement déclenché lorsque le mot de passe fourni est incorrect
socket.on('invalidPassword', () => {
    alert("Mot de passe incorrect."); // Message d'erreur pour mot de passe incorrect
});

// Mise à jour de la grille du jeu
socket.on('updateGrid', (grid) => {
    grid.forEach((symbol, index) => {
        document.getElementById(`item${index + 1}`).innerText = symbol; // Mettre à jour l'affichage de chaque case du plateau
    });
});

// Mise à jour du tour du joueur
socket.on('updateTurn', (team) => {
    updateTurnDisplay(team); // Mettre à jour l'affichage du tour avec l'équipe actuelle
});

// Fonction pour mettre à jour l'affichage du tour du joueur
function updateTurnDisplay(turnTeam) {
    const currentPlayerSpan = document.getElementById('current-player');
    const playerTeam = player.team;

    if (turnTeam) {
        currentPlayerSpan.innerText = turnTeam === playerTeam ? 'Votre tour' : `Tour de ${turnTeam}`; // Afficher le tour du joueur
    } else {
        currentPlayerSpan.innerText = `${playerTeam} (Joueur ${player.number})`; // Afficher l'équipe et le numéro du joueur
    }
}

// Événement déclenché lorsque la partie est terminée
socket.on('gameOver', (winner) => {
    alert(winner === 'draw' ? "Match nul!" : `${winner} a gagné!`); // Annonce du résultat de la partie
    document.getElementById('board').style.display = 'none'; // Masquer le plateau de jeu
    document.getElementById('create-room').style.display = 'block'; // Afficher le formulaire de création de salle
    document.getElementById('join-room').style.display = 'block'; // Afficher le formulaire de rejoindre une salle
    socket.emit('leaveRoom', player.room); // Quitter la salle
});

// Événement déclenché pour définir le numéro du joueur
socket.on('playerNumber', ({ team }) => {
    const playerNumber = team === 'X' ? '1' : '2'; // Déterminer le numéro du joueur en fonction de l'équipe
    document.getElementById('player-number').innerText = playerNumber; // Afficher le numéro du joueur
});

// Fonction pour gérer les clics sur les cases du plateau
function choiseCase(clicked_id) {
    const index = parseInt(clicked_id.replace('item', '')) - 1; // Extraire l'index de la case cliquée
    socket.emit('playerMove', { room: player.room, index, team: player.team }); // Émettre le mouvement du joueur au serveur
}
