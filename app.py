import os
import hashlib
from flask import flash
from werkzeug.utils import secure_filename
from config import Config
from functools import wraps
from flask import session, redirect, url_for
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors  import CORS

app = Flask(__name__, static_url_path='/static')

app.config.from_object(Config)
CORS(app)

db = SQLAlchemy(app)

UPLOAD_FOLDER = 'static/images_produits/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    nom_role = db.Column(db.String)

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255))

class Operateur(db.Model):
    __tablename__ = 'operateurs'
    Identifiant = db.Column(db.String, primary_key=True)
    Mdp = db.Column(db.String)
    id_role = db.Column(db.Integer, db.ForeignKey('roles.id'))
    role = db.relationship("Role", backref="operateurs")

class Famille(db.Model):
    __tablename__ = 'familles'

    id = db.Column(db.Integer, primary_key=True)
    nom_famille = db.Column(db.String(100))

    # Relation explicite avec Produit
    produits = db.relationship('Produit', back_populates='famille', lazy=True)


class Produit(db.Model):
    __tablename__ = 'produits'

    id = db.Column(db.Integer, primary_key=True)
    Reference = db.Column(db.String(50))
    Designation = db.Column(db.String(255))
    Date_modification = db.Column(db.DateTime)
    id_famille = db.Column(db.Integer, db.ForeignKey('familles.id'), nullable=False)
    Commentaire = db.Column(db.String(255))
    Photo = db.Column(db.String(512))

    # Relation vers Famille
    famille = db.relationship('Famille', back_populates='produits', lazy=True)

class Fabrication(db.Model):
    __tablename__ = 'fabrications'
    id = db.Column(db.Integer, primary_key=True)
    sn = db.Column(db.String(255))
    Date_fabrication = db.Column(db.Date)
    id_produit = db.Column(db.Integer, db.ForeignKey('produits.id'))
    id_client = db.Column(db.Integer, db.ForeignKey('clients.id'))

class Parametre(db.Model):
    __tablename__ = 'parametres'

    id = db.Column(db.Integer, primary_key=True)
    Nom_parametre = db.Column(db.String(100), nullable=False)  # Le nom du paramètre
    Valeur_theorique = db.Column(db.Float, nullable=False)  # La valeur théorique du paramètre
    Valeur_min = db.Column(db.Float, nullable=True)  # La valeur minimale pour ce paramètre
    Valeur_max = db.Column(db.Float, nullable=True)  # La valeur maximale pour ce paramètre
    id_produit = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)  # Clé étrangère vers la table 'produits'
    id_unite = db.Column(db.Integer, db.ForeignKey('unites.id'), nullable=False)  # Clé étrangère vers la table 'unites'
    Type_parametre = db.Column(db.Integer, db.ForeignKey('types.id'), nullable=False)  # Clé étrangère vers la table 'types'
    Nom_parametre1 = db.Column(db.String(40))
    Nom_parametre2 = db.Column(db.String(40))

    # Relations
    produit = db.relationship('Produit', backref='parametres', lazy=True)
    unite = db.relationship('Unite', backref='parametres', lazy=True)
    type = db.relationship('Type', backref='parametres', lazy=True)  # Relation vers la table 'Type'


class Unite(db.Model):
    __tablename__ = 'unites'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)  # id Primaire, AUTO_INCREMENT
    nom_unite = db.Column(db.String(5), nullable=False)  # nom_unite, de type varchar(5)

class Type(db.Model):
    __tablename__ = 'types'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom_type = db.Column(db.String(30), nullable=False)


class Mesure(db.Model):
    __tablename__ = 'mesures'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    mesure = db.Column(db.Numeric(10, 3), nullable=False)
    sn_fabrication = db.Column(db.Integer, nullable=True)  # Peut être NULL
    id_testeur = db.Column(db.Integer, nullable=False)
    id_parametre = db.Column(db.Integer, db.ForeignKey('parametres.id'), nullable=False)
    date_Mesure = db.Column(db.Date, nullable=False)
    Resultat_test = db.Column(db.String(10), nullable=True)  # Peut être NULL

    parametre = db.relationship('Parametre', backref=db.backref('mesures', cascade="all, delete"), foreign_keys=[id_parametre])


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Vérifier si l'utilisateur est connecté (si un user_id est présent dans la session)
        if 'user_id' not in session:
            return redirect(url_for('connexion', next=request.url))

        # Vérifier si l'utilisateur existe dans la base de données (SQLAlchemy)
        user_id = session['user_id']
        user = Operateur.query.filter_by(Identifiant=user_id).first()

        # Si l'utilisateur n'existe pas, rediriger vers la page de connexion
        if not user:
            return redirect(url_for('connexion', next=request.url))

        # L'utilisateur est authentifié et valide, continue avec la fonction d'origine
        return f(*args, **kwargs)

    return decorated_function

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # Cherche l'utilisateur dans la base de données
    user = Operateur.query.filter_by(Identifiant=username).first()

    if user:
        # Vérifie si l'utilisateur a le rôle désactivé (id_role == 3)
        if user.id_role == 3:
            flash("Votre compte est désactivé. Veuillez contacter l'administrateur.", "danger")
            return redirect(url_for('connexion'))

        # Hacher le mot de passe soumis avec MD5 pour comparer avec celui dans la base de données
        mdp_hash = hashlib.md5(password.encode('utf-8')).hexdigest()

        # Vérifie si le mot de passe haché correspond à celui dans la base de données
        if user.Mdp == mdp_hash:
            # Authentification réussie
            session['user_id'] = user.Identifiant
            session['user_role'] = user.id_role  # Stocke le rôle dans la session

            # Redirige vers la page d'origine ou la page par défaut
            next_page = request.args.get('next', url_for('produits'))
            return redirect(next_page)
        else:
            flash('Mot de passe incorrect', 'danger')
            return redirect(url_for('connexion'))
    else:
        flash('Identifiant incorrect', 'danger')
        return redirect(url_for('connexion'))

@app.route('/static/<path:filename>')
@login_required
def static_files(filename):
    return send_from_directory(app.static_folder, filename)
@app.route('/api/data/<int:id_parametre>')
@login_required
def get_chart_data(id_parametre):
    mesures = (
        db.session.query(Mesure.mesure,
            Mesure.date_Mesure,
            Parametre.Nom_parametre,
            Parametre.Valeur_theorique,
            Parametre.Valeur_min,
            Parametre.Valeur_max,
            Produit.Designation)
        .join(Parametre, Mesure.id_parametre == Parametre.id)
        .join(Produit, Parametre.id_produit == Produit.id)
        .filter(Mesure.id_parametre == id_parametre)
        .order_by(Mesure.date_Mesure)  # Tri par date
        .all()
    )

    if not mesures:
        produit = db.session.query(Produit.Designation).join(Parametre, Produit.id == Parametre.id_produit).filter(
            Parametre.id == id_parametre).first()
        Nom_produit = produit.Designation if produit else "Produit inconnu"

        return jsonify({
            "error": "Aucune mesure n'a été effectuée pour ce produit.",
            "Nom_produit": Nom_produit
        }), 200

    labels = [''] * len(mesures)  # Remplace les dates par des indices 0,1,2,3...
    dates_tooltip = [m.date_Mesure.strftime("%Y-%m-%d") for m in mesures]# Format date
    values = [float(m.mesure) for m in mesures]  # Convertir en float
    Nom_parametre = mesures[0].Nom_parametre
    Nom_produit = mesures[0].Designation
    Valeur_theorique = float(mesures[0].Valeur_theorique) if mesures[0].Valeur_theorique else None
    Valeur_min = float(mesures[0].Valeur_min) if mesures[0].Valeur_min else None
    Valeur_max = float(mesures[0].Valeur_max) if mesures[0].Valeur_max else None

    return jsonify({"labels": labels,
        "data": values,
        "Nom_parametre": Nom_parametre,
        "Nom_produit": Nom_produit,
        "Valeur_theorique": Valeur_theorique,
        "Valeur_min": Valeur_min,
        "Valeur_max": Valeur_max,
        "dates_tooltip":dates_tooltip}), 200


@app.route('/api/parametres')
def get_parametres():
    reference = request.args.get('reference')
    if reference:
        produit = Produit.query.filter_by(Reference=reference).first()
        if not produit:
            return jsonify([])

        parametres = Parametre.query.filter_by(id_produit=produit.id).all()
    else:
        parametres = Parametre.query.all()  # fallback (non recommandé ici)

    resultat = [{
        'id_parametre': p.id,
        'nom_parametre': p.Nom_parametre,
        'valeur_theorique': p.Valeur_theorique,
        'valeur_min': p.Valeur_min,
        'valeur_max': p.Valeur_max
    } for p in parametres]

    return jsonify(resultat)


@app.route('/test_data')
@login_required
def test_data():
    param_count = db.session.query(Parametre).count()
    mesure_count = db.session.query(Mesure).count()
    return jsonify({
        "Nombre de paramètres": param_count,
        "Nombre de mesures": mesure_count
    })



@app.route('/gestion', methods=['GET', 'POST'])
@login_required
def gestionOperateur():
    # Vérifier si l'utilisateur est connecté en vérifiant la session
    if 'user_id' in session and 'user_role' in session:
        user_id = session['user_id']
        user_role = session['user_role']

        # Vérifier si l'utilisateur a le rôle 1 (administrateur)
        if user_role == 1:
            # Récupérer les opérateurs et effectuer la jointure sur les rôles
            operateurs = Operateur.query.join(Role).all()

            # Formater les résultats pour afficher "Nom", "Mdp", "Droit" et "Supprimer"
            result = [
                {"Nom": op.Identifiant, "Mdp": op.Mdp, "Droit": op.role.nom_role, "Supprimer": "❌"}
                for op in operateurs
            ]

            # Afficher la page de gestion avec les résultats formatés
            return render_template('gestion.html', operateurs=result)

        # Si l'utilisateur n'a pas le rôle adéquat, ne rien renvoyer ni afficher
        return "", 204  # Retourne un code HTTP 204 (No Content), ce qui signifie qu'il n'y a rien à afficher

    # Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    flash('Vous devez être connecté pour accéder à cette page.', 'danger')
    return redirect(url_for('connexion'))


@app.route('/droits')
@login_required
def droits():
    return render_template('droits.html')

@app.route('/get-operateurs')
@login_required
def get_operateurs():
    operateurs = Operateur.query.join(Role).all()
    result = [{"Nom": op.Identifiant, "Mdp": op.Mdp, "Droit": op.role.nom_role, "Supprimer": "❌"} for op in operateurs]
    return jsonify(result)

@app.route('/save-operateurs', methods=['POST'])
@login_required
def save_operateurs():
    data = request.get_json()

    for row in data:
        if row['Nom']:  # Si le champ 'Nom' est renseigné
            operateur = Operateur.query.filter_by(Identifiant=row['Nom']).first()
            if operateur:
                # Si un mot de passe est fourni et qu'il diffère de celui existant, le mettre à jour
                if row['Mdp'] and row['Mdp'] != operateur.Mdp:  # Vérifier si le mot de passe a changé
                    mdp_hash = hashlib.md5(row['Mdp'].encode('utf-8')).hexdigest()  # Hachage MD5 du mot de passe
                    operateur.Mdp = mdp_hash  # Mettre à jour le mot de passe uniquement s'il est différent

                # Mettre à jour le rôle si nécessaire
                operateur.role = Role.query.filter_by(nom_role=row['Droit']).first()
            else:
                # Ajouter un nouvel opérateur
                if row['Mdp']:  # Assurez-vous que le mot de passe est fourni
                    mdp_hash = hashlib.md5(row['Mdp'].encode('utf-8')).hexdigest()  # Hachage MD5 du mot de passe
                    role = Role.query.filter_by(nom_role=row['Droit']).first()
                    new_operateur = Operateur(Identifiant=row['Nom'], Mdp=mdp_hash, role=role)
                    db.session.add(new_operateur)

    db.session.commit()
    return jsonify({"status": "success"})


@app.route('/Graphique')
def graphique():
    reference = request.args.get('reference')
    return render_template('graphique.html', reference_produit=reference)

@app.route('/api/parametre_par_reference/<reference>')
def get_parametre_par_reference(reference):
    produit = db.session.query(Produit).filter_by(reference=reference).first()
    if not produit:
        return jsonify({'error': 'Produit introuvable'}), 404
    parametre = db.session.query(Parametre).filter_by(id_produit=produit.id).first()
    if not parametre:
        return jsonify({'error': 'Aucun paramètre trouvé'}), 404
    return jsonify({
        'id_parametre': parametre.id_parametre,
        'nom_parametre': parametre.nom_parametre
    })

@app.route('/')
def connexion():
    return render_template('connexion.html')



@app.route('/logout')
def logout():
    session.pop('user_id', None)  # Déconnecte l'utilisateur
    flash('Déconnexion réussie!', 'success')
    return redirect(url_for('connexion'))




@app.route('/produits')
@login_required
def produits():
    try:
        # Utilisation de SQLAlchemy pour récupérer les produits et leurs familles
        produits = db.session.query(Produit.Reference, Produit.Designation, Produit.Photo, Produit.Date_modification, Famille.nom_famille).join(Famille).all()

        # Convertir les résultats en un format similaire à ce que vous obtenez avec `fetchall()`
        result = []
        for produit in produits:
            result.append({
                "Reference": produit.Reference,
                "Designation": produit.Designation,
                "Photo": produit.Photo,
                "Date_modification": produit.Date_modification,
                "nom_famille": produit.nom_famille
            })

        return render_template('produits.html', produits=result)

    except Exception as e:
        # Si une erreur se produit lors de la récupération des produits, afficher un message d'erreur
        return f"Erreur de connexion à la base de données. Détails: {str(e)}", 500



@app.route('/get-produits')
@login_required
def get_produits():
    try:
        # Récupérer tous les produits avec leurs familles associées
        produits = Produit.query.join(Famille).add_columns(
            Produit.Reference, Produit.Designation, Produit.Photo, Produit.Date_modification, Famille.nom_famille
        ).all()

        # Préparer la liste de résultats pour renvoyer en JSON
        result = []
        for produit in produits:
            result.append({
                "Reference": produit.Reference,
                "Designation": produit.Designation,
                "Photo": produit.Photo,
                "Date_modification": produit.Date_modification,
                "nom_famille": produit.nom_famille
            })

        return jsonify(result)

    except Exception as e:
        # En cas d'erreur de connexion ou autre, on renvoie une erreur
        return jsonify({"error": str(e)}), 500

@app.route('/save-produit', methods=['POST'])
@login_required
def save_produit():
    data = request.get_json()

    db.session.commit()
    return jsonify({"status": "success"})



@app.route('/fabrication')
@login_required
def fabrication():
    try:
        # Récupérer les fabrications avec les informations liées (produits et clients)
        fabrications = Fabrication.query.join(Produit).join(Client).add_columns(
            Fabrication.sn, Produit.Reference, Produit.Designation, Fabrication.Date_fabrication, Client.nom
        ).all()

        # Préparer la liste des résultats pour passer aux templates
        result = []
        for fabrication in fabrications:
            result.append({
                "Numéro de Série": fabrication.sn,
                "Référence": fabrication.Reference,
                "Désignation": fabrication.Designation,
                "Date de Fabrication": fabrication.Date_fabrication,
                "Client": fabrication.nom
            })

        return render_template('fabrication.html', fabrication=result)

    except Exception as e:
        # En cas d'erreur de connexion ou autre, on renvoie une erreur
        return jsonify({"error": str(e)}), 500


@app.route('/get-fabrication')
@login_required
def get_fabrication():
    try:
        # Récupérer les fabrications avec les informations liées (produits et clients)
        fabrications = Fabrication.query.join(Produit).join(Client).add_columns(
            Fabrication.sn, Produit.Reference, Produit.Designation, Fabrication.Date_fabrication, Client.nom
        ).all()

        # Préparer la liste des résultats à envoyer en JSON
        result = []
        for fabrication in fabrications:
            result.append({
                "Numéro de Série": fabrication.sn,
                "Référence": fabrication.Reference,
                "Désignation": fabrication.Designation,
                "Date de Fabrication": fabrication.Date_fabrication,
                "Client": fabrication.nom
            })

        return jsonify(result)

    except Exception as e:
        # En cas d'erreur de connexion ou autre, on renvoie une erreur
        return jsonify({"error": str(e)}), 500



@app.route('/save-fabrication', methods=['POST'])
@login_required
def save_fabrication():
    return jsonify({"status": "success"})


@app.route('/ajoutProduit')
@login_required
def ajoutproduit():
    return render_template('ajoutprod.html')


@app.route('/ajoutFabrication')
@login_required
def ajoutfabrication():
    dernier_sn = db.session.query(Fabrication.sn).order_by(Fabrication.sn.desc()).first()
    if dernier_sn:
        nouveau_sn = int(dernier_sn[0]) + 1

    return render_template('ajoutfab.html', nouveau_sn=nouveau_sn)


@app.route('/ajoutfab')
@login_required
def ajoutfab():
    reference_produit = request.args.get('reference')  # Récupère la référence du produit depuis l'URL
    produit = Produit.query.filter_by(Reference=reference_produit).first()  # Cherche le produit dans la base de données

    if produit:
        # Récupère le dernier numéro de série dans la table Fabrication
        dernier_sn = db.session.query(Fabrication.sn).order_by(Fabrication.sn.desc()).first()
        if dernier_sn:
            # Prend le dernier numéro de série et ajoute 1
            nouveau_sn = int(dernier_sn[0]) + 1

        # Passe le nouveau numéro de série et la référence produit au template HTML
        return render_template('ajoutfab.html', produit=produit, reference_produit=reference_produit, nouveau_sn=nouveau_sn)
    else:
        flash('Produit non trouvé.', 'danger')
        return redirect(url_for('produits'))


@app.route('/analyse')
@login_required
def analyse():
    return render_template('analyse.html')


@app.route('/aide')
@login_required
def aide():
    return render_template('aide.html')


@app.route('/mesure')
@login_required
def mesure():
    return render_template('mesure.html')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/ajouter_produit', methods=['GET', 'POST'])
def ajouter_produit():
    if request.method == 'POST':
        # Récupérer les données envoyées par le formulaire
        reference = request.form['reference']
        designation = request.form['designation']
        famille_id = request.form['famille']
        date_modification = request.form['date']
        commentaire = request.form['commentaire']

        # Créer un nouvel objet Produit avec une valeur vide pour Photo par défaut
        nouveau_produit = Produit(
            Reference=reference,
            Designation=designation,
            id_famille=famille_id,
            Date_modification=date_modification,
            Commentaire=commentaire,
            Photo="blank"  # Par défaut, on initialise Photo à une chaîne vide
        )

        # Si un fichier image est téléchargé, gérer le fichier
        if 'file-upload' in request.files:
            file = request.files['file-upload']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                nouveau_produit.Photo = filename  # Met à jour le champ 'Photo' du produit avec le nom de fichier

        # Ajouter le produit à la session
        db.session.add(nouveau_produit)
        db.session.commit()  # Sauvegarde dans la base de données

        flash('Produit ajouté avec succès!', 'success')
        return redirect(url_for('ficheprod', reference=nouveau_produit.Reference))  # Redirige vers la page du produit nouvellement ajouté

    # Récupérer les familles pour le menu déroulant
    familles = Famille.query.all()

    # Afficher le formulaire pour ajouter un produit
    return render_template('ajouter_produit.html', familles=familles)


@app.route('/ficheprod', methods=['GET', 'POST'])
def ficheprod():
    reference_produit = request.args.get('reference')
    produit = Produit.query.filter_by(Reference=reference_produit).first()

    if produit is None:
        flash('Produit introuvable', 'danger')
        return redirect(url_for('index'))  # Ou redirigez vers une autre page appropriée

    if request.method == 'POST':
        # Mise à jour de la famille
        if 'famille' in request.form:
            famille_id = request.form['famille']
            if famille_id:
                produit.id_famille = famille_id  # Mise à jour de la clé étrangère id_famille
                db.session.commit()

        # Mise à jour des autres champs (Référence, Désignation, Date, Commentaire)
        if 'reference' in request.form:
            produit.Reference = request.form['reference']

        if 'designation' in request.form:
            produit.Designation = request.form['designation']

        if 'date' in request.form:
            produit.Date_modification = request.form['date']

        if 'commentaire' in request.form:
            produit.Commentaire = request.form['commentaire']

        # Gestion du fichier image
        if 'file-upload' in request.files:
            file = request.files['file-upload']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                produit.Photo = filename  # Met à jour le champ 'Photo' du produit
                db.session.commit()
                flash('Image téléchargée avec succès!', 'success')

        db.session.commit()  # Enregistre les modifications dans la base de données
        flash('Produit mis à jour avec succès!', 'success')
        return redirect(url_for('ficheprod', reference=produit.Reference))

    # Récupérer l'image et le commentaire du produit
    image_name = produit.Photo if produit.Photo else None
    image_url = url_for('static', filename='images_produits/' + image_name) if image_name else None

    # Récupérer les familles pour le menu déroulant
    familles = Famille.query.all()

    return render_template('ficheprod.html', produit=produit,
                           reference_produit=reference_produit,
                           designation_produit=produit.Designation,
                           date_modification=produit.Date_modification,
                           famille_produit=produit.famille,  # Nous passons l'objet famille
                           familles=familles,  # Liste de familles pour le select
                           commentaire_produit=produit.Commentaire,
                           image_url=image_url)


@app.route('/parametres', methods=['GET'])
def parametres():
    reference_produit = request.args.get('reference')
    produit = Produit.query.filter_by(Reference=reference_produit).first()

    if produit is None:
        return jsonify({'error': 'Produit introuvable'}), 404  # Si produit introuvable

    # Récupérer l'ID du produit mais ne pas l'inclure dans le tableau retourné
    produit_id = produit.id

    # Récupérer les paramètres du produit
    parametres = Parametre.query.filter_by(id_produit=produit_id).all()
    parametres_data = [
        {
            "idProduit": produit_id,  # Ajouter l'ID du produit mais ne pas l'afficher dans la réponse
            "typeSet": param.Nom_parametre if param.Nom_parametre else '',
            "valTheo": param.Valeur_theorique if param.Valeur_theorique is not None else 0,
            "valMin": param.Valeur_min if param.Valeur_min is not None else 0,
            "valMax": param.Valeur_max if param.Valeur_max is not None else 0,
            "typeParametre": param.type.nom_type if param.type else '',  # Récupérer le nom du type
            "unite": param.unite.nom_unite if param.unite else '',  # Récupérer le nom de l'unité
        }
        for param in parametres
    ]

    # Vérifiez que parametres_data n'est pas vide
    if not parametres_data:
        parametres_data = [{"typeSet": "", "valTheo": 0, "valMin": 0, "valMax": 0, "typeParametre": "", "unite": ""}]

    # Filtrer l'ID du produit avant de le renvoyer (pour ne pas l'afficher dans la réponse)
    for param in parametres_data:
        param.pop('idProduit', None)

    # Retourne les paramètres sous forme de JSON
    return jsonify(parametres_data)


@app.route('/update_settings', methods=['POST'])
def update_settings():
    data = request.get_json()
    print("Données reçues:", data)

    reference_produit = data.get("reference")
    parametres = data.get("parametres")

    if not reference_produit or parametres is None:
        return jsonify({"success": False, "error": "Référence ou paramètres manquants"}), 400

    produit = Produit.query.filter_by(Reference=reference_produit).first()
    if not produit:
        return jsonify({"success": False, "error": "Produit introuvable"}), 404

    # Suppression des paramètres qui ne sont plus dans la liste
    existing_params = Parametre.query.filter_by(id_produit=produit.id).all()
    nom_params_reçus = [param["Nom_parametre"] for param in parametres]

    for existing_param in existing_params:
        if existing_param.Nom_parametre not in nom_params_reçus:
            # Vérifier si des mesures sont associées au paramètre
            mesures = Mesure.query.filter_by(id_parametre=existing_param.id).all()
            if mesures:
                return jsonify({"success": False, "error": f"Impossible de supprimer le paramètre '{existing_param.Nom_parametre}', il est lié à des mesures"}), 400

            # Supprimer les mesures associées avant de supprimer le paramètre
            Mesure.query.filter_by(id_parametre=existing_param.id).delete()
            db.session.delete(existing_param)  # Supprime le paramètre

    # Mise à jour ou création des nouveaux paramètres
    for param in parametres:
        Nom_parametre = param.get("Nom_parametre")
        Valeur_theorique = param.get("Valeur_theorique")
        Valeur_min = param.get("Valeur_min")
        Valeur_max = param.get("Valeur_max")
        id_unite = param.get("id_unite")
        Type_parametre = param.get("Type_parametre")

        if not all([Nom_parametre, Valeur_theorique is not None, Valeur_min is not None, Valeur_max is not None, id_unite is not None, Type_parametre is not None]):
            return jsonify({"success": False, "error": "Paramètre manquant ou invalide"}), 400

        existing_param = Parametre.query.filter_by(id_produit=produit.id, Nom_parametre=Nom_parametre).first()

        if existing_param:
            existing_param.Valeur_theorique = Valeur_theorique
            existing_param.Valeur_min = Valeur_min
            existing_param.Valeur_max = Valeur_max
            existing_param.id_unite = id_unite
            existing_param.Type_parametre = Type_parametre
        else:
            new_param = Parametre(
                id_produit=produit.id,
                Nom_parametre=Nom_parametre,
                Valeur_theorique=Valeur_theorique,
                Valeur_min=Valeur_min,
                Valeur_max=Valeur_max,
                id_unite=id_unite,
                Type_parametre=Type_parametre
            )
            db.session.add(new_param)

    db.session.commit()

    return jsonify({"success": True})

@app.route("/api/reference_produit/<int:id_produit>")
def get_reference_produit(id_produit):
    produit = Produit.query.get(id_produit)
    if produit:
        return jsonify({"reference": produit.Reference})
    else:
        return jsonify({"error": "Produit non trouvé"}), 404

@app.route('/get_mappings', methods=['GET']) #Route pour recuperer les Unites et Type de param en fonction des ID
def get_mappings():
    # Récupérer tous les mappages d'unités et de types de paramètres
    unite_mappings = {unite.nom_unite: unite.id for unite in Unite.query.all()}
    type_mappings = {type_param.nom_type: type_param.id for type_param in Type.query.all()}

    return jsonify({
        "uniteMapping": unite_mappings,
        "typeMapping": type_mappings
    })

@app.route('/get_updated_data', methods=['GET'])
def get_updated_data():
    reference_produit = request.args.get("reference")

    if not reference_produit:
        return jsonify({"success": False, "error": "Référence produit manquante"}), 400

    produit = Produit.query.filter_by(Reference=reference_produit).first()
    if not produit:
        return jsonify({"success": False, "error": "Produit introuvable"}), 404

    parametres = Parametre.query.filter_by(id_produit=produit.id).all()

    updated_data = [
        {
            "Nom_parametre": param.Nom_parametre,
            "Valeur_theorique": param.Valeur_theorique,
            "Valeur_min": param.Valeur_min,
            "Valeur_max": param.Valeur_max,
            "id_unite": param.id_unite,
            "Type_parametre": param.Type_parametre
        }
        for param in parametres
    ]

    return jsonify({"success": True, "updated_params": updated_data})



@app.route('/delete_parametre/<int:param_id>', methods=['DELETE'])
def delete_parametre(param_id):
    # Rechercher le paramètre dans la base de données
    parametre = Parametre.query.get(param_id)

    if not parametre:
        return jsonify({"success": False, "error": "Paramètre introuvable"}), 404

    # Vérifier s'il y a des mesures liées à ce paramètre
    mesures = Mesure.query.filter_by(parametre_id=param_id).all()

    if mesures:
        return jsonify({"success": False, "error": "Impossible de supprimer le paramètre, il est lié à des mesures"}), 400

    try:
        # Supprimer le paramètre
        db.session.delete(parametre)
        db.session.commit()
        return jsonify({"success": True, "message": "Paramètre supprimé avec succès"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500



@app.route('/fichefab')
@login_required
def fichefab():
    return render_template('fichefab.html')

@app.route('/mesures')
@login_required
def mesures():
    return render_template('mesures.html')



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
