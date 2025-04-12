// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = '../index.html';
        return null;
    }
    return user;
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user) {
        // Afficher les informations de l'utilisateur
        document.getElementById('userInfo').innerHTML = `
            <div>
                <p class="font-semibold">${user.prenom}</p>
                <p class="text-sm text-gray-600">${user.telephone}</p>
                <button id="logoutBtn" class="text-sm text-red-600 hover:underline">Déconnexion</button>
            </div>
        `;

        // Gestionnaire de déconnexion
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }

    // Initialiser l'application
    initApp();
});

// Base URL pour l'API
const API_URL = 'http://localhost:3000';

// Référence pour les produits
let currentReference = generateReference();

// Variable pour stocker l'ID du produit en cours d'édition
let editingProductId = null;

// Variables pour la gestion des unités temporaires
let tempUnites = [];

// Initialiser l'application
async function initApp() {
    // Charger les données initiales
    await Promise.all([
        fetchCategories(),
        fetchUnites(),
        fetchFournisseurs(),
        fetchProducts()
    ]);

    // Gestion du formulaire principal
    document.getElementById('stockForm').addEventListener('submit', handleSubmitProduct);

    // Gestion de l'image
    document.getElementById('selectImageBtn').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });

    document.getElementById('imageInput').addEventListener('change', handleImageSelect);

    // Afficher la référence
    document.getElementById('referenceDisplay').textContent = currentReference;

    // Gestion des modales
    setupModalHandlers();
    
    // Pré-remplir les champs de l'unité avec des valeurs par défaut
    document.getElementById('uniteBase').value = 'Tissu';
    document.getElementById('uniteMetre').value = 'mètre';
    
    // Ajouter un gestionnaire pour ajouter une unité temporaire au tableau
    document.getElementById('addUniteToTable').addEventListener('click', addTempUnite);
    
    // Charger les unités existantes dans la table temporaire lors de l'ouverture du modal
    document.getElementById('addUniteBtn').addEventListener('click', loadExistingUnites);
}

// Générer une référence unique
function generateReference() {
    const prefix = 'Baz-Tissu-';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum.toString().padStart(4, '0')}`;
}

// Configuration des gestionnaires pour les modales
function setupModalHandlers() {
    // Modal fournisseur
    document.getElementById('addFournisseurBtn').addEventListener('click', () => {
        document.getElementById('fournisseurModal').classList.remove('hidden');
    });
    
    document.getElementById('cancelFournisseur').addEventListener('click', () => {
        document.getElementById('fournisseurModal').classList.add('hidden');
        document.getElementById('fournisseurForm').reset();
    });
    
    document.getElementById('fournisseurForm').addEventListener('submit', handleSubmitFournisseur);

    // Modal catégorie
    document.getElementById('addCategorieBtn').addEventListener('click', () => {
        document.getElementById('categorieModal').classList.remove('hidden');
    });
    
    document.getElementById('cancelCategorie').addEventListener('click', () => {
        document.getElementById('categorieModal').classList.add('hidden');
        document.getElementById('categorieForm').reset();
    });
    
    document.getElementById('categorieForm').addEventListener('submit', handleSubmitCategorie);

    // Modal unité
    document.getElementById('addUniteBtn').addEventListener('click', () => {
        document.getElementById('uniteModal').classList.remove('hidden');
    });
    
    document.getElementById('cancelUnite').addEventListener('click', () => {
        document.getElementById('uniteModal').classList.add('hidden');
        document.getElementById('uniteForm').reset();
        tempUnites = []; // Réinitialiser les unités temporaires
    });
    
    document.getElementById('uniteForm').addEventListener('submit', handleSubmitUnite);
}

// Gestion de la sélection d'image
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = `<img src="${event.target.result}" alt="Aperçu" class="h-full w-full object-contain">`;
        };
        reader.readAsDataURL(file);
    }
}

// Récupérer les catégories
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        const selectElement = document.getElementById('categorie');
        // Garder l'option par défaut
        selectElement.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nom;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

// Récupérer les unités
async function fetchUnites() {
    try {
        const response = await fetch(`${API_URL}/unites`);
        const unites = await response.json();
        
        const selectElement = document.getElementById('unite');
        // Garder l'option par défaut
        selectElement.innerHTML = '<option value="">Sélectionner une unité</option>';
        
        unites.forEach(unite => {
            const option = document.createElement('option');
            option.value = unite.id;
            option.textContent = unite.nom;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des unités:', error);
    }
}

// Récupérer les fournisseurs
async function fetchFournisseurs() {
    try {
        const response = await fetch(`${API_URL}/fournisseurs`);
        const fournisseurs = await response.json();
        
        const selectElement = document.getElementById('fournisseur');
        // Garder l'option par défaut
        selectElement.innerHTML = '<option value="">Sélectionner un fournisseur</option>';
        
        fournisseurs.forEach(f => {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = `${f.prenom} ${f.nom}`;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des fournisseurs:', error);
    }
}

// Récupérer les produits
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/produits`);
        const produits = await response.json();
        
        // Récupérer les données complémentaires (catégories, unités, fournisseurs)
        const [categories, unites, fournisseurs] = await Promise.all([
            fetch(`${API_URL}/categories`).then(res => res.json()),
            fetch(`${API_URL}/unites`).then(res => res.json()),
            fetch(`${API_URL}/fournisseurs`).then(res => res.json())
        ]);
        
        const categoriesMap = categories.reduce((acc, cat) => {
            acc[cat.id] = cat.nom;
            return acc;
        }, {});
        
        const unitesMap = unites.reduce((acc, unite) => {
            acc[unite.id] = unite.nom;
            return acc;
        }, {});
        
        const fournisseursMap = fournisseurs.reduce((acc, f) => {
            acc[f.id] = `${f.prenom} ${f.nom}`;
            return acc;
        }, {});

        renderProductsTable(produits, categoriesMap, unitesMap, fournisseursMap);
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
    }
}

// Afficher les produits dans le tableau
function renderProductsTable(produits, categoriesMap, unitesMap, fournisseursMap) {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = '';
    
    produits.forEach(produit => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${produit.libelle}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${categoriesMap[produit.categorieId] || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${produit.quantite}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${produit.prix}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${fournisseursMap[produit.fournisseurId] || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${unitesMap[produit.uniteId] || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-3 edit-product" data-id="${produit.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900 delete-product" data-id="${produit.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Ajouter les gestionnaires d'événements pour l'édition et la suppression
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

// Fonction pour éditer un produit
async function editProduct(productId) {
    try {
        // Stocker l'ID du produit en cours d'édition
        editingProductId = productId;
        
        // Récupérer les détails du produit
        const response = await fetch(`${API_URL}/produits/${productId}`);
        const product = await response.json();
        
        // Remplir le formulaire avec les données du produit
        document.getElementById('libelle').value = product.libelle;
        document.getElementById('categorie').value = product.categorieId;
        document.getElementById('quantite').value = product.quantite;
        document.getElementById('unite').value = product.uniteId;
        document.getElementById('prix').value = product.prix;
        document.getElementById('fournisseur').value = product.fournisseurId;
        
        // Mettre à jour la référence
        currentReference = product.reference;
        document.getElementById('referenceDisplay').textContent = currentReference;
        
        // Mettre à jour l'aperçu d'image si disponible
        if (product.imageUrl) {
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = `<p class="text-center text-gray-600">Image existante: ${product.imageUrl}</p>`;
        }
        
        // Faire défiler jusqu'au formulaire
        document.getElementById('stockForm').scrollIntoView({ behavior: 'smooth' });
        
        // Changer le texte du bouton de soumission
        document.getElementById('submitBtn').textContent = 'MODIFIER';
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        alert('Erreur lors de la récupération du produit.');
    }
}

// Fonction pour supprimer un produit
async function deleteProduct(productId) {
    // Demander confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        return;
    }
    
    try {
        // Envoyer la requête de suppression
        const response = await fetch(`${API_URL}/produits/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Recharger les produits
            fetchProducts();
            alert('Produit supprimé avec succès!');
        } else {
            alert('Erreur lors de la suppression du produit.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue.');
    }
}

// Gérer la soumission du formulaire de produit
async function handleSubmitProduct(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const libelle = document.getElementById('libelle').value;
    const categorieId = document.getElementById('categorie').value;
    const quantite = document.getElementById('quantite').value;
    const uniteId = document.getElementById('unite').value;
    const prix = document.getElementById('prix').value;
    const fournisseurId = document.getElementById('fournisseur').value;
    
    // Récupérer l'image
    const imageInput = document.getElementById('imageInput');
    let imageUrl = null;
    
    if (imageInput.files.length > 0) {
        // Simuler le stockage de l'image
        imageUrl = imageInput.files[0].name;
    }
    
    // Créer l'objet produit
    const product = {
        libelle,
        categorieId: parseInt(categorieId),
        quantite: parseInt(quantite),
        uniteId: parseInt(uniteId),
        prix: parseFloat(prix),
        fournisseurId: parseInt(fournisseurId),
        reference: currentReference,
        dateCreation: new Date().toISOString()
    };
    
    // Si une image est sélectionnée, l'ajouter à l'objet produit
    if (imageUrl) {
        product.imageUrl = imageUrl;
    }
    
    try {
        let url = `${API_URL}/produits`;
        let method = 'POST';
        
        // Si on est en mode édition
        if (editingProductId) {
            url = `${API_URL}/produits/${editingProductId}`;
            method = 'PUT';
            
            // Pour l'édition, si aucune nouvelle image n'est sélectionnée, conserver l'image existante
            if (!imageUrl) {
                const response = await fetch(`${API_URL}/produits/${editingProductId}`);
                const existingProduct = await response.json();
                if (existingProduct.imageUrl) {
                    product.imageUrl = existingProduct.imageUrl;
                }
            }
        }
        
        // Envoyer les données à l'API
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        if (response.ok) {
            // Réinitialiser le formulaire
            document.getElementById('stockForm').reset();
            
            // Réinitialiser l'aperçu d'image
            const previewContainer = document.getElementById('imagePreviewContainer');
            previewContainer.innerHTML = '<i class="fas fa-image text-gray-400 text-4xl"></i>';
            
            // Générer une nouvelle référence seulement si on n'est pas en mode édition
            if (!editingProductId) {
                currentReference = generateReference();
            }
            document.getElementById('referenceDisplay').textContent = currentReference;
            
            // Réinitialiser le mode édition
            editingProductId = null;
            
            // Restaurer le texte du bouton
            document.getElementById('submitBtn').textContent = 'VALIDER';
            
            // Recharger les produits
            fetchProducts();
            
            alert(editingProductId ? 'Produit modifié avec succès!' : 'Produit ajouté avec succès!');
        } else {
            alert(`Erreur lors de l'${editingProductId ? 'édition' : 'ajout'} du produit.`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue.');
    }
}

// Gérer la soumission du formulaire de fournisseur
async function handleSubmitFournisseur(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const prenom = document.getElementById('fournisseurPrenom').value;
    const nom = document.getElementById('fournisseurNom').value;
    const telephone = document.getElementById('fournisseurTelephone').value;
    const adresse = document.getElementById('fournisseurAdresse').value;
    
    // Créer l'objet fournisseur
    const fournisseur = {
        prenom,
        nom,
        telephone,
        adresse
    };
    
    try {
        // Envoyer les données à l'API
        const response = await fetch(`${API_URL}/fournisseurs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(fournisseur)
        });
        
        if (response.ok) {
            // Fermer la modal
            document.getElementById('fournisseurModal').classList.add('hidden');
            
            // Réinitialiser le formulaire
            document.getElementById('fournisseurForm').reset();
            
            // Recharger les fournisseurs
            await fetchFournisseurs();
            
            alert('Fournisseur ajouté avec succès!');
        } else {
            alert('Erreur lors de l\'ajout du fournisseur.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue.');
    }
}

// Gérer la soumission du formulaire de catégorie
async function handleSubmitCategorie(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const nom = document.getElementById('nomCategorie').value;
    
    // Créer l'objet catégorie
    const categorie = {
        nom
    };
    
    try {
        // Envoyer les données à l'API
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categorie)
        });
        
        if (response.ok) {
            // Fermer la modal
            document.getElementById('categorieModal').classList.add('hidden');
            
            // Réinitialiser le formulaire
            document.getElementById('categorieForm').reset();
            
            // Recharger les catégories
            await fetchCategories();
            
            alert('Catégorie ajoutée avec succès!');
        } else {
            alert('Erreur lors de l\'ajout de la catégorie.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue.');
    }
}

// Charger les unités existantes dans la table temporaire
async function loadExistingUnites() {
    try {
        const response = await fetch(`${API_URL}/unites`);
        const unites = await response.json();
        
        // Filtrer pour ne pas inclure les unités de base (assumant que les 2 premières sont les unités de base)
        const filteredUnites = unites.filter(unite => unite.id > 2);
        
        tempUnites = filteredUnites.map(unite => ({
            id: unite.id,
            nom: unite.nom,
            conversion: unite.conversion || 1,
            inDatabase: true // Marquer que cette unité existe déjà dans la base de données
        }));
        
        renderTempUnites();
    } catch (error) {
        console.error('Erreur lors du chargement des unités existantes:', error);
    }
}

// Ajouter une unité temporaire à la table
function addTempUnite() {
    const nom = document.getElementById('nomUnite').value.trim();
    const conversion = parseFloat(document.getElementById('conversion').value);
    
    if (!nom || isNaN(conversion) || conversion <= 0) {
        alert('Veuillez remplir correctement tous les champs.');
        return;
    }
    
    // Vérifier si cette unité existe déjà dans la liste temporaire
    if (tempUnites.some(u => u.nom.toLowerCase() === nom.toLowerCase())) {
        alert('Cette unité existe déjà.');
        return;
    }
    
    // Ajouter à la liste temporaire
    tempUnites.push({
        id: `temp-${Date.now()}`, // ID temporaire
        nom,
        conversion,
        inDatabase: false // Marquer que cette unité n'existe pas encore dans la base de données
    });
    
    // Afficher dans le tableau
    renderTempUnites();
    
    // Réinitialiser les champs
    document.getElementById('nomUnite').value = '';
    document.getElementById('conversion').value = '';
}

// Afficher les unités temporaires dans le tableau
function renderTempUnites() {
    const tableBody = document.getElementById('unitesTableBody');
    tableBody.innerHTML = '';
    
    tempUnites.forEach(unite => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${unite.nom}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${unite.conversion.toFixed(4)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-red-600 hover:text-red-900 delete-temp-unite" data-id="${unite.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Ajouter les gestionnaires d'événements pour la suppression
    document.querySelectorAll('.delete-temp-unite').forEach(btn => {
        btn.addEventListener('click', () => {
            const uniteId = btn.getAttribute('data-id');
            deleteTempUnite(uniteId);
        });
    });
}

// Supprimer une unité temporaire
async function deleteTempUnite(id) {
    const unite = tempUnites.find(u => u.id == id);
    
    // Si l'unité existe déjà dans la base de données, on la supprime via l'API
    if (unite && unite.inDatabase) {
        // Demander confirmation
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'unité "${unite.nom}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/unites/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                alert('Erreur lors de la suppression de l\'unité.');
                return;
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la suppression de l\'unité.');
            return;
        }
    }
    
    // Supprimer de la liste temporaire
    tempUnites = tempUnites.filter(unite => unite.id != id);
    
    // Rafraîchir l'affichage
    renderTempUnites();
}

// Gérer la soumission du formulaire d'unité
async function handleSubmitUnite(event) {
    event.preventDefault();
    
    // Récupérer les nouvelles unités à ajouter (celles qui ne sont pas encore dans la base de données)
    const newUnites = tempUnites.filter(unite => !unite.inDatabase);
    
    try {
        // Effectuer des requêtes en parallèle pour chaque nouvelle unité
        const promises = newUnites.map(unite => 
            fetch(`${API_URL}/unites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nom: unite.nom,
                    conversion: unite.conversion
                })
            })
        );
        
        await Promise.all(promises);
        
        // Fermer la modal
        document.getElementById('uniteModal').classList.add('hidden');
        
        // Réinitialiser le formulaire et les unités temporaires
        document.getElementById('uniteForm').reset();
        tempUnites = [];
        
        // Recharger les unités
        await fetchUnites();
        
        alert('Unités ajoutées avec succès!');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de l\'ajout des unités.');
    }
}document.addEventListener('DOMContentLoaded', function() {
    // Référence aux éléments du DOM
    const nomUniteInput = document.getElementById('nomUnite');
    const conversionInput = document.getElementById('conversion');
    const unitesTableBody = document.getElementById('unitesTableBody');
    const uniteForm = document.getElementById('uniteForm');
    
    // Charger les unités depuis db.json
    function chargerUnites() {
        fetch('http://localhost:3000/unites')
            .then(response => response.json())
            .then(data => {
                afficherUnites(data);
            })
            .catch(error => {
                console.error('Erreur lors du chargement des unités:', error);
            });
    }
    
    // Fonction pour afficher les unités dans le tableau
    function afficherUnites(unites) {
        unitesTableBody.innerHTML = '';
        
        unites.forEach(unite => {
            const tr = document.createElement('tr');
            
            // Colonne libellé
            const tdLibelle = document.createElement('td');
            tdLibelle.className = 'px-6 py-4 whitespace-nowrap';
            tdLibelle.textContent = unite.nom;
            tr.appendChild(tdLibelle);
            
            // Colonne conversion (si elle existe)
            const tdConversion = document.createElement('td');
            tdConversion.className = 'px-6 py-4 whitespace-nowrap';
            tdConversion.textContent = unite.conversion || '-';
            tr.appendChild(tdConversion);
            
            // Colonne action
            const tdAction = document.createElement('td');
            tdAction.className = 'px-6 py-4 whitespace-nowrap';
            
            // Bouton supprimer (pas pour les unités existantes avec ID < 3)
            const btnSupprimer = document.createElement('button');
            btnSupprimer.className = 'text-red-500';
            btnSupprimer.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnSupprimer.dataset.id = unite.id;
            
            if (parseInt(unite.id) < 3) {
                btnSupprimer.disabled = true;
                btnSupprimer.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                btnSupprimer.addEventListener('click', function() {
                    supprimerUnite(unite.id);
                });
            }
            
            tdAction.appendChild(btnSupprimer);
            tr.appendChild(tdAction);
            
            unitesTableBody.appendChild(tr);
        });
    }
    
    // Fonction pour supprimer une unité
    function supprimerUnite(id) {
        fetch(`http://localhost:3000/unites/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                chargerUnites(); // Recharger la liste
                mettreAJourSelectUnites(); // Mettre à jour le select
            }
        })
        .catch(error => console.error('Erreur:', error));
    }
    
    // Gestion de la soumission du formulaire d'unité
    uniteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const nomUnite = nomUniteInput.value.trim();
        const conversion = conversionInput.value.trim();
        
        if (!nomUnite) {
            alert('Veuillez saisir un nom d\'unité');
            return;
        }
        
        // Création de la nouvelle unité
        const nouvelleUnite = {
            nom: nomUnite,
            conversion: conversion || undefined // Ne pas inclure si vide
        };
        
        // Envoyer à l'API
        fetch('http://localhost:3000/unites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nouvelleUnite)
        })
        .then(response => {
            if (!response.ok) throw new Error('Erreur serveur');
            return response.json();
        })
        .then(data => {
            // Réinitialiser le formulaire
            nomUniteInput.value = '';
            conversionInput.value = '';
            
            // Recharger les unités
            chargerUnites();
            mettreAJourSelectUnites();
            
            // Fermer la modal
            document.getElementById('uniteModal').classList.add('hidden');
            
            alert('Unité ajoutée avec succès');
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'ajout de l\'unité');
        });
    });
    
    // Fonction pour mettre à jour le select d'unités
    function mettreAJourSelectUnites() {
        fetch('http://localhost:3000/unites')
            .then(response => response.json())
            .then(unites => {
                const selectUnite = document.getElementById('unite');
                selectUnite.innerHTML = '<option value="">Sélectionner une unité</option>';
                
                unites.forEach(unite => {
                    const option = document.createElement('option');
                    option.value = unite.id;
                    option.textContent = unite.nom;
                    selectUnite.appendChild(option);
                });
            });
    }
    
    // Gestionnaire pour le bouton d'ajout d'unité
    document.getElementById('addUniteBtn').addEventListener('click', function() {
        // Charger les unités
        chargerUnites();
        
        // Afficher la modal
        document.getElementById('uniteModal').classList.remove('hidden');
    });
    
    // Gestionnaire pour le bouton Annuler
    document.getElementById('cancelUnite').addEventListener('click', function() {
        document.getElementById('uniteModal').classList.add('hidden');
    });
    
    // Charger les unités au démarrage
    mettreAJourSelectUnites();
});