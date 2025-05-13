let chart = null;
let windowStart = 0;
let windowSize = 0;
const minWindowSize = 10;

window.onload = () => {
    chargerParametres();
};
// Charger les paramètres depuis l'API
async function chargerParametres() {
    try {
        console.log("📡 Chargement des paramètres...");

        const referenceProduit = document.getElementById("prod-data").getAttribute("data-produit-id");
        const response = await fetch(`http://127.0.0.1:5000/api/parametres?reference=${referenceProduit}`);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const parametres = await response.json();
        console.log("✅ Paramètres pour produit", referenceProduit, ":", parametres);

        if (!Array.isArray(parametres) || parametres.length === 0) {
            throw new Error("Aucun paramètre disponible pour ce produit");
        }

        const id_parametre_default = parametres[0].id_parametre;  // prendre le premier paramètre lié au produit
        genererGraphique(id_parametre_default);

    } catch (error) {
        console.error("❌ Erreur lors du chargement des paramètres:", error);
    }
}



function telechargerPDF() {
    const element = document.getElementById("graphiqueContainer");

    // Vérifier si le graphique est visible
    if (element.children.length === 0) {
        alert("Le graphique est vide. Veuillez générer un graphique avant de télécharger.");
        return;
    }

    // Sauvegarder les dimensions d'origine du conteneur
    const originalWidth = element.offsetWidth;
    const originalHeight = element.offsetHeight;

    // Appliquer un redimensionnement CSS uniquement pour le PDF
    element.style.width = "1000px";  // Largeur réduite pour le PDF
    element.style.height = "1000px"; // Hauteur réduite pour le PDF

    // Ajouter un petit délai pour que le redimensionnement ait lieu avant de générer le PDF
    setTimeout(() => {
        // Options pour html2pdf avec un redimensionnement contrôlé
        const options = {
            margin: 10, // Ajuster la marge autour du graphique
            filename: 'mesures.pdf',
            html2canvas: {
                scale: 2, // Améliorer la qualité du rendu
                logging: true, // Permet de déboguer si nécessaire
                useCORS: true, // Permet de charger les images depuis d'autres domaines si nécessaire
            },
            jsPDF: {
                unit: 'mm', // Les unités utilisées pour le PDF sont en mm
                format: 'a4', // Format A4
                orientation: 'landscape', // Orientation paysage
                compressPdf: true, // Compression pour réduire la taille du fichier PDF
            }
        };

        // Générer le PDF avec html2pdf
        html2pdf()
            .from(element)
            .set(options)
            .save("mesures.pdf")
            .then(() => {
                // Rétablir les dimensions d'origine du conteneur après génération du PDF
                element.style.width = originalWidth + "px";
                element.style.height = originalHeight + "px";
            });
    }, 300); // Le délai de 300ms garantit que le redimensionnement est pris en compte avant l'export
}

// Récupérer les données du graphique
async function fetchChartData(id_parametre) {
    let referenceProduit = document.getElementById("prod-data").getAttribute("data-produit-id");
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/data/${id_parametre}?reference=${referenceProduit}`);
        return await response.json();
    } catch (error) {
        console.error("Erreur API :", error);
        return null;
    }
}

// Générer le graphique avec min, max et moyenne
async function genererGraphique(id_parametre) {
    if (!id_parametre) {
        alert("Veuillez sélectionner un paramètre");
        return;
    }

    let referenceProduit = document.getElementById("prod-data").getAttribute("data-produit-id");
    console.log("Référence produit : ", referenceProduit);

    const chartData = await fetchChartData(id_parametre);
    console.log(chartData.dates_tooltip);
    if (!chartData) return;

    document.title = `Graphique - ${chartData.Nom_produit} (réf:${referenceProduit})`;
    document.querySelector("h1").textContent = `${referenceProduit}`;

    // On ne cache plus le graphique, il est toujours affiché
    document.getElementById("graphiqueContainer").style.display = "block";
    document.getElementById("messageContainer").style.display = "none";  // Masquer tout message d'erreur

    const Nom_parametre = chartData.Nom_parametre || "Inconnu";
    const Valeur_theorique = chartData.Valeur_theorique || "Inconnu";
    const Valeur_min = chartData.Valeur_min || "Inconnu";
    const Valeur_max = chartData.Valeur_max || "Inconnu";

    // Si un graphique existe déjà, on le détruit avant de recréer
    if (chart !== null) {
        chart.destroy();
    }

    // Convertir les valeurs en nombres
    const valeurs = chartData.data.map(val => Number(val));
    const minVal = Math.min(...valeurs);
    const maxVal = Math.max(...valeurs);
    const avgVal = valeurs.reduce((sum, value) => sum + value, 0) / valeurs.length;

    // Ajouter une marge de 5% (ou plus si nécessaire)
    const marge = Math.max((maxVal - minVal) * 0.05);

    const ctx = document.getElementById("myChart").getContext("2d");
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: `Mesure ${referenceProduit}`,
                    data: valeurs,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: `Mesure theorique: ${Valeur_theorique}`,
                    data: new Array(chartData.labels.length).fill(Valeur_theorique),
                    borderColor: 'orange',
                    borderWidth: 2,
                    borderDash: [0, 0],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: `Mesure Min: ${Valeur_min}`,
                    data: new Array(chartData.labels.length).fill(Valeur_min),
                    borderColor: 'red',
                    borderWidth: 1,
                    borderDash: [0, 0],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: `Mesure Max: ${Valeur_max}`,
                    data: new Array(chartData.labels.length).fill(Valeur_max),
                    borderColor: 'green',
                    borderWidth: 1,
                    borderDash: [0, 0],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: `Moy: ${avgVal.toFixed(2)}`,
                    data: new Array(chartData.labels.length).fill(avgVal),
                    borderColor: 'blue',
                    borderWidth: 1,
                    borderDash: [0, 0],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: `${valeurs.length} mesure(s)`,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMin: minVal - marge,
                    suggestedMax: maxVal + marge,
                    grid: {
                        drawOnChartArea: true,
                        display: false
                    },
                    ticks: {
                        callback: function (value) {
                            if (value === minVal || value === maxVal) {
                                return value.toFixed(2);
                            }
                            return value.toFixed(2);
                        },
                    }
                }
            },
            plugins: {
                tooltip: {
                    enable: true,
                    callbacks: {
                        title: function (tooltipItems) {
                            return "Date: " + (chartData.dates_tooltip[tooltipItems[0].dataIndex] || "Non trouvé");
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        speed: 20
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.005  // Plus petit = zoom plus précis
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        limits: {
                            x: {
                                minRange: 10  // Minimum 10 points visibles (empêche de trop zoomer)
                            }
                        },
                        callbacks: {
                            label: function (tooltipItem) {
                                const datasetLabel = tooltipItem.dataset.label || '';
                                const value = tooltipItem.formattedValue;
                                return `${datasetLabel}: ${Number(value).toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// Charger les paramètres au démarrage
chargerParametres();
