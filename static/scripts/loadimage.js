function loadImage(event) {
    const imageContainer = document.getElementById('image-container');
    const file = event.target.files[0];

    if (file) {
        console.log("Fichier sélectionné : ", file);  // Vérification du fichier
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imageContainer.innerHTML = '';
            imageContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    } else {
        console.log("Aucun fichier sélectionné");
    }
}
