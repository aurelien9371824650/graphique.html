window.onload = function () {
    let table; // Variable pour stocker l'instance de Tabulator

    // Charger les données depuis le backend Flask
    fetch("/get-operateurs")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des données depuis le serveur !");
            }
            return response.json();
        })
        .then((data) => {
            // Initialiser le tableau avec les données récupérées
            table = new Tabulator("#table-Operateurs", {
                locale: true,
                langs: {
                    fr: {
                        columns: { photo: "Photo" },
                        pagination: {
                            first: "Premier",
                            last: "Dernier",
                            prev: "Précédent",
                            next: "Suivant",
                            page_size: "Affichage",
                            counter: { showing: "Affiche", of: "sur", rows: "lignes", pages: "Pages" },
                        },
                        footer: { page_size: "Afficher", showing: "Affichage", of: "sur" },
                        headerFilters: { default: "Filtrer" },
                    },
                },
                lang: "fr",
                height: "350px",
                layout: "fitColumns",
                pagination: "local",
                paginationSize: 5,
                paginationSizeSelector: [5, 8],
                movableColumns: true,
                paginationCounter: "rows",
                data: data, // Injecter les données dans le tableau
                rowHeight: 30,
                columns: [
                    { title: "Nom", field: "Nom", width: 400, editor: "input", headerFilter: "input" },
                    {
                        title: "Droit",
                        field: "Droit",
                        width: 250,
                        editor: "list",
                        headerFilter: true,
                        editorParams: {
                            values: { admin: "admin", operateur: "opérateur", desactivé: "désactivé" },
                            clearable: true,
                        },
                        headerFilterParams: {
                            values: { admin: "admin", operateur: "opérateur", desactivé: "désactivé" },
                            clearable: true,
                        },
                    },
                    { title: "Mot de Passe", field: "Mdp", width: 200, editor: "input", headerFilter: "input" },
                ],
            });

            // Événement déclenché après l'édition d'une cellule
            table.on("cellEdited", function (cell) {
                if (cell.getField() === "Droit") {
                    let newValue = cell.getValue();
                    let oldValue = cell.getOldValue();

                    // Si la valeur est vide, on remet l'ancienne valeur
                    if (!newValue) {
                        cell.setValue(oldValue, true); // `true` empêche un nouvel événement cellEdited
                    }
                }
            });
        })
        .catch((error) => console.error("Erreur lors du chargement des données :", error));

    // Gestion de l'événement pour ajouter une nouvelle ligne
    document.getElementById("add-ope").addEventListener("click", function () {
        if (table) {
            table.addRow({ Nom: "", Droit: "operateur", Mdp: "" }); // Valeur par défaut : "operateur"
        } else {
            console.error("Tableau non initialisé !");
        }
    });

    // Gestion de l'événement pour enregistrer les données
    document.getElementById("save-gestion").addEventListener("click", function () {
        if (table) {
            const data = table.getData(); // Récupère les données du tableau

            fetch("/save-operateurs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data), // Envoie uniquement des données valides
            })
            .then(response => response.json())
            .then(result => {
                alert("Modifications enregistrées avec succès !");
                location.reload(); // Recharge la page après confirmation
            })
            .catch(error => console.error("Erreur lors de l'enregistrement :", error));
        } else {
            console.error("Tableau non initialisé !");
        }
    });
};
