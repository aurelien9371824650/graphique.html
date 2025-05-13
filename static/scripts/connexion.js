document.addEventListener("DOMContentLoaded", function() {
    const mdp = document.getElementById("mdp");
    const mask = document.getElementById("mask");
    const icon = document.getElementById("icon");

    let etat = 1;

    mask.addEventListener("click", function(event) {
        event.preventDefault(); // Empêche l'envoi du formulaire

        if (etat === 1) {
            mdp.type = "text";
            icon.src = "../static/images/open_icon.png";
            etat = 0;
        } else {
            mdp.type = "password";
            icon.src = "../static/images/close_icon.png";
            etat = 1;
        }
    });
});
