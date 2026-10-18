# Backend Python Django - 416 Records REST API

Ce dossier contient le backend complet en Python Django pour l'application Flutter **416 Records**.

## 🚀 Démarrage rapide du serveur Django REST

1. Activez votre environnement virtuel Python :
   ```bash
   cd django_backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

2. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

3. Exécutez les migrations :
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Créez un compte Administrateur :
   ```bash
   python manage.py createsuperuser
   ```

5. Lancez le serveur de développement API :
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## 📡 Endpoints API disponibles
- **Auth JWT**: `http://127.0.0.1:8000/api/token/`
- **Films & Vidéos**: `http://127.0.0.1:8000/api/movies/`
- **Artistes Roster**: `http://127.0.0.1:8000/api/artists/`
- **Tracks & Audio**: `http://127.0.0.1:8000/api/tracks/`
- **Boutique Merch**: `http://127.0.0.1:8000/api/merch/`
- **Commandes**: `http://127.0.0.1:8000/api/orders/`
- **Panneau Admin Django**: `http://127.0.0.1:8000/admin/`
