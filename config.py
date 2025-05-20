class Config:
    SSL_REDIRECT = False
    PREFERRED_URL_SCHEME = 'http'
    SECRET_KEY = "default-secret-key"

    # Configuration de la base de données
    DB_USER = "admin"  # Vérifie cet utilisateur
    DB_PASSWORD = "admin"  # Vérifie le mot de passe
    DB_HOST = "192.168.9.3"  # Vérifie l'adresse IP ou le nom d'hôte
    DB_NAME = "bdd_ecei"  # Vérifie le nom de la base
    DB_PORT = 3306  # Assure-toi que le port est correct

    # Construire l'URL de connexion pour MySQL
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    # Configurations supplémentaires (optionnel)
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Désactive les notifications de modification de base de données (pour optimiser la performance)
