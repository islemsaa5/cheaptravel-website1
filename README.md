
# 🚀 Guide d'Hébergement pour Cheap Travel

Votre application est prête pour le déploiement. Voici les étapes pour la mettre en ligne professionnellement.

## 1. Choix de l'Hébergeur (Recommandé : Vercel)
Vercel est le meilleur choix pour les applications React. Il est gratuit, ultra-rapide et sécurisé.

### Étapes de déploiement sur Vercel :
1. **Créez un compte** sur [vercel.com](https://vercel.com).
2. **Installez la CLI Vercel** ou connectez votre dépôt **GitHub**.
3. **Importez votre projet** : Sélectionnez le dossier contenant tous les fichiers.
4. **Configuration des Variables d'Environnement** (CRUCIAL) :
   - Dans le tableau de bord Vercel, allez dans `Settings` > `Environment Variables`.
   - Ajoutez une nouvelle variable :
     - **Key** : `API_KEY`
     - **Value** : (Insérez votre clé API Google Gemini ici)
5. **Déployez** : Cliquez sur "Deploy".

## 2. Configuration du Nom de Domaine
Pour une agence de voyage, un domaine crédible est essentiel (ex: `www.cheaptravel-dz.com`).
- Achetez un domaine (GoDaddy, Namecheap, ou Icosnet pour un .dz).
- Liez-le dans les paramètres Vercel sous l'onglet `Domains`.

## 3. Sécurité de la Base de Données (Supabase)
Votre base de données Supabase est déjà configurée en mode production. Assurez-vous que :
1. Vos tables (`profiles`, `bookings`, `packages`, `subscribers`) ont les **RLS (Row Level Security)** activées sur le portail Supabase si vous souhaitez restreindre les accès.
2. Le service rôle key n'est jamais exposé publiquement (le code actuel utilise l'anon key pour les opérations clientes et le service role pour les opérations serveurs simulées).

## 4. Maintenance
- **Mises à jour** : Pour modifier une offre, connectez-vous avec le compte `cheaptravel` / `cheaptravel123` directement sur votre site hébergé.
- **Support** : Les messages WhatsApp arriveront directement sur le numéro configuré dans `constants.tsx`.

---
*Note : Si vous utilisez Netlify, créez un fichier `_redirects` contenant `/* /index.html 200` pour éviter les erreurs 404 lors du rafraîchissement des pages.*
