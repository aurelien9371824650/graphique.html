window.onload = function() {
    let lotData = [];
    let table = new Tabulator("#table-Lot", {
        locale: true,
        langs: {
            "fr": {
                "columns": { "photo": "Photo" },
                "pagination": {
                    "first": "Premier",
                    "last": "Dernier",
                    "prev": "Précédent",
                    "next": "Suivant",
                    "page_size": "Affichage",
                    "counter": { "showing": "Affiche", "of": "sur", "rows": "lignes", "pages": "Pages" }
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
        data: lotData,  // Passez les données ici
        rowHeight: 30,
        columns: [
            { title: "Numéro de Série", field: "SN", width: 300, editor: "input", headerFilter: "input" },
            { title: "Mesures", field: "Mesures", width: 150,
                formatter: function (cell) {
                    var link = "/mesure";
                    return '<a href="' + link + '"> ➡️</a>';
                }
            },
            {
                title: "Supprimer",
                field: "supprimer",
                width: 150,
                formatter: function(cell) {
                    return '<span style="cursor:pointer;">❌</span>';
                },
                cellClick: function(e, cell) {
                    cell.getRow().delete();
                }
            }
        ],
    });

    // Ajouter une nouvelle ligne lorsque la dernière ligne est complète
    table.on("cellEdited", function(cell) {
        let rows = table.getRows();
        let lastRow = rows[rows.length - 1].getData();
        if (Object.values(lastRow).slice(0, -1).every(val => val.trim() !== "")) {
            table.addRow({
                SN: "",
                Mesures: "➡️",
                supprimer: "❌"
            });
        }
    });

    // Ajouter un bouton pour ajouter une nouvelle ligne manuellement
    document.getElementById("add-row").addEventListener("click", function(event) {
        event.preventDefault();
        table.addRow({
            SN: "",
            Mesures: "➡️",
            supprimer: "❌"
        });
    });
};
