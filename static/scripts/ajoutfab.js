window.onload = function() {
    // Récupère la référence du produit depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const referenceProduit = urlParams.get('reference'); // Récupère le paramètre 'reference'

    // Utilise le numéro de série passé depuis Flask
    const numSerie = document.getElementById('numSerie').getAttribute('data-numSerie');

    // Initialisation de la table
    let tableData = [];
    let table = new Tabulator("#table-ajoutfab", {
        locale: true,
        langs: {
            "fr": {
                "columns": { "photo": "Photo" },
                "pagination": {
                    "first": "Premier", "last": "Dernier", "prev": "Précédent", "next": "Suivant",
                    "page_size": "Affichage", "counter": { "showing": "Affiche", "of": "sur", "rows": "lignes", "pages": "Pages" }
                },
                "footer": { "page_size": "Afficher", "showing": "Affichage", "of": "sur" },
                "headerFilters": { "default": "Filtrer" },
            }
        },
        lang: "fr",
        height: "350px",
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 8,
        paginationSizeSelector: [5, 8],
        movableColumns: true,
        paginationCounter: "rows",
        data: tableData,
        rowHeight: 30,
        columns: [
            { title: "Clients", field: "clients", width: 150, editor: "input", headerFilter: "input" },
            { title: "Références", field: "ref", width: 250, editor: "input", headerFilter: "input" },
            { title: "Quantités", field: "nbPiece", width: 150, editor: "input", headerFilter: "input" },
            { title: "Date de Fabrication", field: "dateFab", width: 200, editor: "input", headerFilter: "input" },
            { title: "Premier N° de série", field: "numSerie", width: 200, formatter: "html", editor: "input", headerFilter: "input" },
            { title: "Supprimer", field: "supprimer", width: 150, formatter: "html",
                cellClick: function(e, cell) {
                    table.deleteRow(cell.getRow());
                }
            },
        ],
    });

    // Attendre que la table soit complètement construite avant d'ajouter une ligne
    table.on("tableBuilt", function() {
        if (referenceProduit && numSerie) {
                document.getElementById("reference").innerHTML = referenceProduit;

                // Ajout d'une ligne avec les données
                const today = new Date();
                const day = ("0" + today.getDate()).slice(-2);
                const month = ("0" + (today.getMonth() + 1)).slice(-2);
                const year = today.getFullYear();
                const dateFab = `${day}/${month}/${year}`;

                // Ajoute la ligne
                table.addRow({ clients: "", ref: referenceProduit, nbPiece: "", dateFab: dateFab, numSerie: numSerie, supprimer: "❌" });
            }
    });

    // Ajoute une ligne vide si la dernière ligne est remplie
    table.on("cellEdited", function(cell) {
        let rows = table.getRows();
        if (rows.length > 0) {
            let lastRow = rows[rows.length - 1].getData();
            if (Object.values(lastRow).slice(0, -1).every(val => val.trim() !== "")) {
                table.addRow({ clients: "", ref: referenceProduit || "", nbPiece: "", dateFab: "", numSerie: "", supprimer: "❌" });
            }
        }
    });

    // Ajoute une ligne lorsque le bouton est cliqué
    document.getElementById("add-row").addEventListener("click", function() {
        const today = new Date();
        const day = ("0" + today.getDate()).slice(-2); // Ajouter un 0 si nécessaire
        const month = ("0" + (today.getMonth() + 1)).slice(-2); // Ajouter un 0 si nécessaire
        const year = today.getFullYear();
        const dateFab = `${day}/${month}/${year}`; // Format de la date : DD/MM/YYYY

        table.addRow({ clients: "", ref: referenceProduit || "", nbPiece: "", dateFab: dateFab, numSerie: numSerie, supprimer: "❌" });
    });
};

