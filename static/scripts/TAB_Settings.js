window.onload = function() {
    // Récupérer la référence du produit depuis l'élément data-reference
    const referenceProduit = document.getElementById('parametres-data').getAttribute('data-reference');

    // Effectuer une requête AJAX pour obtenir les paramètres
    fetch(`/parametres?reference=${referenceProduit}`)
        .then(response => response.json())
        .then(parametresData => {
            // Vérification que parametresData est bien un tableau
            if (!Array.isArray(parametresData)) {
                console.error("Les données des paramètres ne sont pas un tableau valide :", parametresData);
                return;
            }

            // Initialiser Tabulator avec les données des paramètres récupérées
            let table = new Tabulator("#table-Settings", {
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
                data: parametresData,  // Passez les données ici
                rowHeight: 30,
                columns: [
                    { title: "Type de Paramètre", field: "typeParametre", width: 150, editor: "input", headerFilter: "input" },
                    { title: "Nom du Paramètre", field: "typeSet", width: 200, editor: "input", headerFilter: "input" },
                    { title: "Unité", field: "unite", width: 100, editor: "input", headerFilter: "input" },
                    { title: "Valeur Théorique", field: "valTheo", width: 150, editor: "input", headerFilter: "input" },
                    { title: "Valeur Minimum", field: "valMin", width: 150, editor: "input", headerFilter: "input" },
                    { title: "Valeur Maximale", field: "valMax", width: 150, editor: "input", headerFilter: "input" },
                    {
                    title: "Supprimer",
                    field: "supprimer",
                    width: 100,
                    formatter: function(cell) {
                        return '<span style="cursor:pointer;">❌</span>';
                    },
                    cellClick: function(e, cell) {
                        let rowData = cell.getRow().getData();
                        if (rowData.id) {
                            fetch(`/delete_parametre/${rowData.id}`, {
                                method: "DELETE"
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    cell.getRow().delete();
                                    return fetch("/get_updated_data"); // Récupérer les données mises à jour
                                } else {
                                    alert("Erreur : " + data.error);
                                    return null;
                                }
                            })
                            .then(response => response ? response.json() : null)
                            .then(updatedData => {
                                if (updatedData) {
                                    table.setData(updatedData); // Met à jour le tableau après suppression
                                }
                            })
                            .catch(error => {
                                console.error("Erreur :", error);
                                alert("Une erreur s'est produite.");
                            });
                        } else {
                            cell.getRow().delete();
                        }
                    }
                }
                ],
            });

            // Ajouter une nouvelle ligne lorsque la dernière ligne est complète
            table.on("cellEdited", function(cell) {
                let rows = table.getRows();
                let lastRow = rows[rows.length - 1].getData();
                if (Object.values(lastRow).slice(0, -1).every(val => val.trim() !== "")) {
                    table.addRow({ typeSet: "", valTheo: "", valMin: "", valMax: "", typeParametre: "", unite: "", modification: "", supprimer: "❌" });
                }
            });

            // Ajouter un bouton pour ajouter une nouvelle ligne manuellement
            document.getElementById("add-row").addEventListener("click", function(event) {
                event.preventDefault();
                table.addRow({ typeSet: "", valTheo: "", valMin: "", valMax: "", typeParametre: "", unite: "", modification: "", supprimer: "❌" });
            });

            document.getElementById("valide").addEventListener("click", function(event) {
                event.preventDefault();

                fetch("/get_mappings")
                    .then(response => response.json())
                    .then(mappings => {
                        const uniteMapping = mappings.uniteMapping;
                        const typeMapping = mappings.typeMapping;

                        let data = table.getData();

                        let parametresToSend = data.filter(row => row.typeSet.trim() !== "").map(row => {
                            return {
                                Nom_parametre: row.typeSet,
                                Valeur_theorique: row.valTheo ? parseFloat(row.valTheo) : 0,
                                Valeur_min: row.valMin ? parseFloat(row.valMin) : 0,
                                Valeur_max: row.valMax ? parseFloat(row.valMax) : 0,
                                id_unite: uniteMapping[row.unite],
                                Type_parametre: typeMapping[row.typeParametre],
                            };
                        });

                        console.log("Paramètres envoyés:", {
                            reference: referenceProduit,
                            parametres: parametresToSend
                        });

                        fetch("/update_settings", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                reference: referenceProduit,
                                parametres: parametresToSend
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
                            if (data.success) {
                                alert("Paramètres mis à jour avec succès !");

                                // Récupérer les données mises à jour et rafraîchir le tableau
                                return fetch(`/get_updated_data?reference=${referenceProduit}`);
                            } else {
                                throw new Error("Erreur lors de la mise à jour : " + data.error);
                            }
                        })
                        .then(response => response.json())
                        .then(updatedData => {
                            console.log("Données mises à jour :", updatedData);
                            table.setData(updatedData.updated_params);
                            location.reload()
                        })
                        .catch(error => {
                            console.error("Erreur:", error);
                            alert("Une erreur s'est produite : " + error.message);
                            location.reload()
                        });
                    });
            });
        });
};
