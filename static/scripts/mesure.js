window.onload = function() {
    var tableData = [];

    var table = new Tabulator("#table-mesure", {
        locale: true,
        langs: {
            "fr": {
                "columns": {"photo": "Photo"},
                "pagination": {
                    "first": "Premier",
                    "last": "Dernier",
                    "prev": "Précédent",
                    "next": "Suivant",
                    "page_size": "Affichage",
                    "counter": {"showing": "Affiche", "of": "sur", "rows": "lignes", "pages": "Pages"}
                },
                "footer": {"page_size": "Afficher", "showing": "Affichage", "of": "sur"},
                "headerFilters": {"default": "Filtrer"},
            }
        },
        lang: "fr",
        height: "563px",
        layout: "fitColumns",
        pagination: "local",
        paginationSize: 15,
        paginationSizeSelector: [5, 10, 15],
        movableColumns: true,
        paginationCounter: "rows",
        data: tableData,
        rowHeight: 30,
        columns: [
            {title: "Type de Paramètres", field: "typeSet", width: 400, editor: "input", headerFilter: "input"},
            {title: "Valeur Théorique", field: "valTheo", width: 400, editor: "input", headerFilter: "input"},
        ],
    });
};
