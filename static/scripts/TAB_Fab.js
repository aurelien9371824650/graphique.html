window.onload = function() {
    fetch("/get-fabrication")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des données depuis le serveur !");
            }
            return response.json();
        })
        .then((data) => {

            data.sort((a, b) => {
                const dateA = new Date(a["Date de Fabrication"]);
                const dateB = new Date(b["Date de Fabrication"]);
                return dateB - dateA; // Tri descendant: plus récent en premier
            });

            let table = new Tabulator("#table-Fabrication", {
                locale: true, // active la gestion des langues
                langs: {
                    "fr": {
                        "columns": {
                            "photo": "Photo", // Changer le titre de la colonne
                        },
                        "pagination": {
                            "first": "Premier",
                            "last": "Dernier",
                            "prev": "Précédent",
                            "next": "Suivant",
                            "page_size": "Affichage",
                            "counter": {
                                "showing": "Affiche",
                                "of": "sur",
                                "rows": "lignes",
                                "pages": "Pages",
                            }
                        },
                        "footer": {
                            "page_size": "Afficher",  // Personnalise le texte dans le footer
                            "showing": "Affichage",  // "Affichage 1 à 20 sur 100"
                            "of": "sur",  // "sur 100"
                        },
                        "headerFilters": {
                            "default": "Filtrer"
                        },
                    }
                },
                lang: "fr",
                height: "765px",
                layout: "fitColumns",
                pagination: "local",
                paginationSize: 20,
                paginationSizeSelector: [5, 10, 15, 20],
                movableColumns: true,
                paginationCounter: "rows",
                data: data,
                rowHeight: 33,
                columns: [
                    {title: "Numéro de série", field: "Numéro de Série", width: 120, headerFilter: "input"},
                    {title: "Référence", field: "Référence", width: 350, headerFilter: "input"},
                    {title: "Désignation", field: "Désignation", width: 350, headerFilter: "input"},
                    {
                        title: "Date de Fabrication",
                        field: "Date de Fabrication",
                        width: 150,
                        // Fonction de tri des dates
                        sorter: function (a, b) {
                            const dateA = new Date(a); // Assurez-vous que a est au format ISO ou format standard
                            const dateB = new Date(b);
                            return dateA - dateB; // Tri par date (du plus récent au plus ancien)
                        },
                        formatter: function (cell) {
                            const dateStr = cell.getValue();
                            if (dateStr) {
                                const date = new Date(dateStr); // Assurez-vous que la date est bien au format Date
                                return date.toLocaleDateString('fr-FR'); // Afficher sous le format "DD/MM/YYYY"
                            }
                            return ''; // Si pas de date
                        },
                        headerFilter: "date",
                        headerFilterPlaceholder: "Filtrer par date",
                    },
                    {title: "Client", field: "Client", width: 150, headerFilter: "input"},
                    {
                        title: "Modification", field: "modification", width: 120, formatter: function (cell) {
                            var link = "/fichefab";
                            return "<a href='" + link + "'>✏️</a>";
                        }
                    },
                ],
            });
        });
};
