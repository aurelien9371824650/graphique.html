window.onload = function () {

        fetch("/get-produits")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données depuis le serveur !");
                }
                return response.json();
            })
            .then((data) => {

                data.sort((a, b) => {
                const dateA = new Date(a.Date_modification.split('/').reverse().join('-')); // Format: 'YYYY-MM-DD'
                const dateB = new Date(b.Date_modification.split('/').reverse().join('-'));
                return dateB - dateA;  // Tri du plus récent au plus ancien
                });

                let table = new Tabulator("#table-Produits", {
                    locale: true,  // Active la gestion des langues
                    langs: {
                        "fr": {
                            "columns": {
                                "photo": "Photo",  // Changer le titre de la colonne
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
                    height: "724px",
                    layout: "fitColumns",
                    pagination: "local",
                    paginationSize: 10,
                    paginationSizeSelector: [5, 8, 10],
                    movableColumns: true,
                    paginationCounter: "rows",
                    data: data, // Les données récupérées
                    rowHeight: 61.9,
                    columns: [
                            {
                            title: "Famille",
                            field: "nom_famille",
                            width: 170,
                            headerFilter: true,
                            editorParams: {
                                values: {
                                    "Self": "Self",
                                    "Transformateur": "Transformateur",
                                    "Antenne": "Antenne",
                                    "Divers": "Divers"
                                },
                                clearable: true
                            },
                            headerFilterParams: {
                                values: {
                                    "Self": "Self",
                                    "Transformateur": "Transformateur",
                                    "Antenne": "Antenne",
                                    "Divers": "Divers"
                                },
                                clearable: true
                            }
                        },
                        {title: "Référence", field: "Reference", width: 300, headerFilter: "input"},
                        {title: "Désignation", field: "Designation", width: 350, headerFilter: "input"},
                        {
                            title: "Date",
                            field: "Date_modification", // Le nom du champ dans la réponse JSON
                            width: 150,
                            sorter: function(a, b) {
                                // Conversion des dates au format Date pour un tri correct
                                const dateA = new Date(a.split('/').reverse().join('-')); // Convertir en format ISO (YYYY-MM-DD)
                                const dateB = new Date(b.split('/').reverse().join('-'));
                                return dateA - dateB; // Tri par date (du plus récent au plus ancien)
                            },
                            formatter: function(cell) {
                                const dateStr = cell.getValue(); // La valeur de la cellule (qui est une date au format ISO)

                                if (dateStr) {
                                    // Crée un objet Date en JavaScript à partir de la chaîne ISO
                                    const date = new Date(dateStr);
                                    return date.toLocaleDateString('fr-FR'); // Format: 'DD/MM/YYYY'
                                }
                                return ''; // Si la date est vide, retourne une chaîne vide
                            },
                            headerFilter: "date",
                            headerFilterPlaceholder: "Filtrer par date",
                        },
                        {
                            title: "Photo",
                            field: "photo",
                            width: 80,
                            headerFilter: "image",
                            formatter: function (cell) {
                                const imageUrl = cell.getValue();
                                return `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><img src="/static/images_produits/${imageUrl}" style="max-width: 50px; height: auto;" /> </div>`;
                            },
                        },
                        {
                            title: "Fabrication",
                            field: "fabrication",
                            width: 120,
                            formatter: function (cell) {
                                var referenceProduit = cell.getRow().getData().Reference;  // Récupère la référence du produit depuis la ligne
                                var link = "/ajoutfab?reference=" + referenceProduit;  // Crée l'URL avec la référence
                                return "<a href='" + link + "' class='mettre-en-fabrication'>➡️</a>";
                            },
                        },
                        {
                            title: "Modification", field: "modification", width: 120, formatter: function (cell) {
                                var referenceProduit = cell.getRow().getData().Reference;
                                var link = "/ficheprod?reference=" + referenceProduit;
                                return "<a href='" + link + "' class='fiche-produit'>✏️</a>";
                            }
                        },
                    ],
                });
            })
            .catch((error) => {
                console.error("Erreur de récupération des données :", error);
            });
    };