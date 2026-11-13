// ======================================
// 1. RECUPERATION DES ELEMENTS HTML
// ======================================

const jours = document.getElementById("jours");
const moisAnnee = document.getElementById("moisAnnee");

const formulaire = document.getElementById("formEvenement");
const champTitre = document.getElementById("titre");
const champDate = document.getElementById("date");
const champHeure = document.getElementById("heure");
const champRappel = document.getElementById("rappel");

const listeEvenements = document.getElementById("listeEvenements");

const alerteSonnerie = document.getElementById("alerteSonnerie");
const messageSonnerie = document.getElementById("messageSonnerie");

const boutonArreter = document.getElementById("arreter");
const boutonRepeter = document.getElementById("repeter");
const boutonActiverSon = document.getElementById("activerSon");
const etatSon = document.getElementById("etatSon");


// ======================================
// 2. VARIABLES
// ======================================

let dateActuelle = new Date();
let dateSelectionnee = null;

let evenements = [];

let evenementEnCours = null;
let intervalleRappel = null;
let intervalleSon = null;

let contexteAudio = null;
let sonActive = false;


// ======================================
// 3. LOCAL STORAGE
// ======================================

function chargerEvenements() {
    try {
        const donnees = localStorage.getItem("mesEvenements");

        evenements = donnees ? JSON.parse(donnees) : [];

        if (!Array.isArray(evenements)) {
            evenements = [];
        }
    } catch (erreur) {
        evenements = [];
        console.error("Erreur de lecture :", erreur);
    }
}

function sauvegarderEvenements() {
    localStorage.setItem(
        "mesEvenements",
        JSON.stringify(evenements)
    );
}


// ======================================
// 4. AFFICHER LE CALENDRIER
// ======================================

function afficherCalendrier() {
    const fragment = document.createDocumentFragment();

    const annee = dateActuelle.getFullYear();
    const mois = dateActuelle.getMonth();

    const nomsJours = [
        "Lun", "Mar", "Mer", "Jeu",
        "Ven", "Sam", "Dim"
    ];

    nomsJours.forEach(nom => {
        const entete = document.createElement("div");
        entete.className = "jour nom-jour";
        entete.textContent = nom;
        fragment.appendChild(entete);
    });

    const premierJour = new Date(annee, mois, 1);
    const decalage = (premierJour.getDay() + 6) % 7;

    const nombreJours =
        new Date(annee, mois + 1, 0).getDate();

    for (let i = 0; i < decalage; i++) {
        const vide = document.createElement("div");
        fragment.appendChild(vide);
    }

    const aujourdHui = new Date();

    for (let i = 1; i <= nombreJours; i++) {
        const jour = document.createElement("div");

        jour.className = "jour";
        jour.textContent = i;

        const dateFormatee =
            annee + "-" +
            String(mois + 1).padStart(2, "0") + "-" +
            String(i).padStart(2, "0");

        if (
            i === aujourdHui.getDate() &&
            mois === aujourdHui.getMonth() &&
            annee === aujourdHui.getFullYear()
        ) {
            jour.classList.add("aujourd-hui");
        }

        if (dateSelectionnee === dateFormatee) {
            jour.classList.add("selectionne");
        }

        const aUnEvenement = evenements.some(
            evenement => evenement.date === dateFormatee
        );

        if (aUnEvenement) {
            jour.classList.add("avec-evenement");
        }

        jour.addEventListener("click", function() {
            dateSelectionnee = dateFormatee;
            champDate.value = dateFormatee;

            afficherCalendrier();
        });

        fragment.appendChild(jour);
    }

    jours.innerHTML = "";
    jours.appendChild(fragment);

    let texteMoisAnnee =
        dateActuelle.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric"
        });

    moisAnnee.textContent =
        texteMoisAnnee.charAt(0).toUpperCase() +
        texteMoisAnnee.slice(1);
}


// ======================================
// 5. NAVIGATION ENTRE LES MOIS
// ======================================

document.getElementById("precedent").addEventListener(
    "click",
    function() {
        dateActuelle = new Date(
            dateActuelle.getFullYear(),
            dateActuelle.getMonth() - 1,
            1
        );

        afficherCalendrier();
    }
);

document.getElementById("suivant").addEventListener(
    "click",
    function() {
        dateActuelle = new Date(
            dateActuelle.getFullYear(),
            dateActuelle.getMonth() + 1,
            1
        );

        afficherCalendrier();
    }
);


// ======================================
// 6. AJOUTER UN EVENEMENT
// ======================================

formulaire.addEventListener("submit", function(event) {
    event.preventDefault();

    const titre = champTitre.value.trim();
    const date = champDate.value;
    const heure = champHeure.value;
    const rappel = Number(champRappel.value);

    if (!titre || !date || !heure) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const dateEvenement = new Date(date + "T" + heure);

    if (Number.isNaN(dateEvenement.getTime())) {
        alert("La date ou l'heure est incorrecte.");
        return;
    }

    if (dateEvenement.getTime() <= Date.now()) {
        alert("Choisissez une date et une heure dans le futur.");
        return;
    }

    const nouvelEvenement = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        titre: titre,
        date: date,
        heure: heure,
        rappel: rappel,
        notifie: false,
        snoozeUntil: null
    };

    evenements.push(nouvelEvenement);

    sauvegarderEvenements();

    afficherEvenements();
    afficherCalendrier();

    formulaire.reset();

    dateSelectionnee = null;
    champDate.value = "";

    alert("Votre événement a bien été enregistré !");

});


// ======================================
// 7. AFFICHER LES EVENEMENTS
// ======================================

function afficherEvenements() {
    listeEvenements.innerHTML = "";

    if (evenements.length === 0) {
        listeEvenements.textContent =
            "Aucun événement enregistré pour le moment.";
        return;
    }

    const evenementsTries = [...evenements].sort(
        (a, b) => {
            const dateA = new Date(a.date + "T" + a.heure);
            const dateB = new Date(b.date + "T" + b.heure);

            return dateA - dateB;
        }
    );

    evenementsTries.forEach(evenement => {
        const carte = document.createElement("div");
        carte.className = "evenement";

        const titre = document.createElement("h3");
        titre.textContent = evenement.titre;

        const date = document.createElement("p");
        date.textContent =
            "Date : " + evenement.date +
            " à " + evenement.heure;

        const rappel = document.createElement("p");
        rappel.textContent =
            "Rappel : " +
            (evenement.rappel === 0
                ? "à l'heure de l'événement"
                : evenement.rappel + " minute(s) avant");

        const boutonSupprimer = document.createElement("button");
        boutonSupprimer.type = "button";
        boutonSupprimer.textContent = "Supprimer";

        boutonSupprimer.addEventListener("click", function() {
            evenements = evenements.filter(
                element => element.id !== evenement.id
            );

            if (
                evenementEnCours &&
                evenementEnCours.id === evenement.id
            ) {
                fermerAlerte();
            }

            sauvegarderEvenements();
            afficherEvenements();
            afficherCalendrier();
        });

        carte.appendChild(titre);
        carte.appendChild(date);
        carte.appendChild(rappel);
        carte.appendChild(boutonSupprimer);

        listeEvenements.appendChild(carte);
    });
}


// ======================================
// 8. ACTIVER LE SON
// ======================================
boutonActiverSon.addEventListener("click", async function() {
    try {
        const AudioContextClasse =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClasse) {
            etatSon.textContent =
                "Le son n'est pas pris en charge par ce navigateur.";
            return;
        }

        if (!contexteAudio) {
            contexteAudio = new AudioContextClasse();
        }

        await contexteAudio.resume();
        sonActive = true;

        // Petit bip pour tester le son
        const oscillateur = contexteAudio.createOscillator();
        const volume = contexteAudio.createGain();

        oscillateur.connect(volume);
        volume.connect(contexteAudio.destination);

        oscillateur.frequency.value = 800;
        volume.gain.value = 0.2;

        oscillateur.start();
        oscillateur.stop(contexteAudio.currentTime + 0.3);

        etatSon.textContent = "Le son des rappels est activé.";
        boutonActiverSon.textContent = "Son activé";

    } catch (erreur) {
        etatSon.textContent = "Impossible d'activer le son.";
        console.error(erreur);
    }
});

// ======================================
// 9. JOUER LA SONNERIE
// ======================================

function jouerUnBip() {
    if (!sonActive || !contexteAudio) {
        return;
    }

    if (contexteAudio.state !== "running") {
        return;
    }

    const oscillateur = contexteAudio.createOscillator();
    const volume = contexteAudio.createGain();

    oscillateur.type = "sine";
    oscillateur.frequency.value = 880;

    volume.gain.setValueAtTime(
        0.15,
        contexteAudio.currentTime
    );

    volume.gain.exponentialRampToValueAtTime(
        0.001,
        contexteAudio.currentTime + 0.4
    );

    oscillateur.connect(volume);
    volume.connect(contexteAudio.destination);

    oscillateur.start();
    oscillateur.stop(contexteAudio.currentTime + 0.4);
}

function demarrerSonnerie() {
    arreterSonnerie();

    jouerUnBip();

    intervalleSon = setInterval(function() {
        jouerUnBip();
    }, 1000);
}

function arreterSonnerie() {
    if (intervalleSon) {
        clearInterval(intervalleSon);
        intervalleSon = null;
    }
}


// ======================================
// 10. DECLENCHER UN RAPPEL
// ======================================

function afficherAlerte(evenement) {
    evenementEnCours = evenement;

    messageSonnerie.textContent =
        "C'est l'heure de : " + evenement.titre;

    alerteSonnerie.hidden = false;

    demarrerSonnerie();
}

function fermerAlerte() {
    arreterSonnerie();

    alerteSonnerie.hidden = true;

    evenementEnCours = null;
}


// ======================================
// 11. ARRETER OU REPETER LE RAPPEL
// ======================================

boutonArreter.addEventListener("click", function() {
    if (!evenementEnCours) {
        return;
    }

    evenementEnCours.notifie = true;
    evenementEnCours.snoozeUntil = null;

    sauvegarderEvenements();

    fermerAlerte();
});

boutonRepeter.addEventListener("click", function() {
    if (!evenementEnCours) {
        return;
    }

    evenementEnCours.snoozeUntil =
        Date.now() + 5 * 60 * 1000;

    sauvegarderEvenements();

    fermerAlerte();
});


// ======================================
// 12. VERIFIER LES RAPPELS
// ======================================
function  verifierRappels () {
if (evenementEnCours) {
        return;
    }

    const maintenant = Date.now();

    for (const evenement of evenements) {
        if (evenement.notifie) {
            continue;
        }

        const dateEvenement =
            new Date(evenement.date + "T" + evenement.heure);

        const heureRappel =
            dateEvenement.getTime() -
            evenement.rappel * 60 * 1000;

        const heureDeclenchement =
            evenement.snoozeUntil || heureRappel;

        if (
            maintenant >= heureDeclenchement &&
            maintenant < dateEvenement.getTime()
        ) {
            evenement.snoozeUntil = null;
            sauvegarderEvenements();

            afficherAlerte(evenement);
            return;
        }

        if (maintenant >= dateEvenement.getTime()) {
            evenement.notifie = true;
            sauvegarderEvenements();
        }
    }
}
function verifierRappels() {
    if (evenementEnCours) {
        return;
    }

    const maintenant = Date.now();

    for (const evenement of evenements) {
        if (evenement.notifie) {
            continue;
        }

        const dateEvenement = new Date(
            evenement.date + "T" + evenement.heure
        );

        const heureRappel =
            dateEvenement.getTime() -
            evenement.rappel * 60 * 1000;

        const heureDeclenchement =
            evenement.snoozeUntil || heureRappel;

        if (maintenant >= heureDeclenchement) {
            evenement.snoozeUntil = null;
            sauvegarderEvenements();
            afficherAlerte(evenement);
            return;
        }
    }
}


// ======================================
// 13. INITIALISATION
// ======================================
chargerEvenements();

afficherCalendrier();
afficherEvenements();

verifierRappels();

intervalleRappel = setInterval(
    verifierRappels,
    1000
);