// Données de l'application
let persons = [];
let appliances = [];
let currentPeriod = '2024-01';

// Tarifs électricité
let elecTarifMethod = 'simple';
let pricePerKwhSimple = 550;
let electricityTranches = [
    { min: 0, max: 50, price: 450 },
    { min: 51, max: 150, price: 550 },
    { min: 151, max: 300, price: 650 },
    { min: 301, max: Infinity, price: 750 }
];
let extraTranches = [];
let trancheCounter = 4;

let pricePerM3 = 2500;
let elecBillAmount = 0;
let waterBillAmount = 0;
let elecConsumption = 0;
let waterConsumption = 0;
let elecMethod = 'basedOnAppliances';
let waterMethod = 'equitable';
let history = [];

// Graphiques
let elecChart, appliancesChart, budgetChart;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    generatePeriodOptions();
    loadData();
    setupEventListeners();
    initTarifSections();
    updateDashboard();
    updatePersonsList();
    updateAppliancesList();
    updateBilling();
    updateHistory();
    updateHeaderStats();
    handleResponsiveCharts();
    initFaqAccordion();
    initConsumptionPreview();
});

// Générer les périodes dynamiques
function generatePeriodOptions() {
    const periodSelect = document.getElementById('period');
    if (!periodSelect) return;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const startYear = 2024;
    const endYear = currentYear + 10;
    
    periodSelect.innerHTML = '';
    
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 0; month < 12; month++) {
            const value = `${year}-${String(month + 1).padStart(2, '0')}`;
            const label = `${monthNames[month]} ${year}`;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            
            if (year === currentYear && month === currentMonth) {
                option.selected = true;
                currentPeriod = value;
            }
            
            periodSelect.appendChild(option);
        }
    }
}

// Initialisation des sections de tarifs
function initTarifSections() {
    const methodSelect = document.getElementById('elecTarifMethod');
    const simpleSection = document.getElementById('simpleTarifSection');
    const tranchesSection = document.getElementById('tranchesTarifSection');
    
    if (methodSelect) {
        methodSelect.addEventListener('change', function() {
            if (this.value === 'simple') {
                simpleSection.style.display = 'block';
                tranchesSection.style.display = 'none';
            } else {
                simpleSection.style.display = 'none';
                tranchesSection.style.display = 'block';
            }
        });
        
        methodSelect.value = elecTarifMethod;
        if (elecTarifMethod === 'simple') {
            if (simpleSection) simpleSection.style.display = 'block';
            if (tranchesSection) tranchesSection.style.display = 'none';
        } else {
            if (simpleSection) simpleSection.style.display = 'none';
            if (tranchesSection) tranchesSection.style.display = 'block';
        }
    }
    
    const limitInputs = ['tranche1Limit', 'tranche2Limit', 'tranche3Limit', 'tranche4Limit'];
    limitInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', updateTrancheDisplays);
        }
    });
    
    updateTrancheDisplays();
}

function updateTrancheDisplays() {
    const t1 = electricityTranches[0];
    const t2 = electricityTranches[1];
    const t3 = electricityTranches[2];
    const t4 = electricityTranches[3];
    
    const limit1Display = document.getElementById('limit1Display');
    const limit2Start = document.getElementById('limit2Start');
    const limit2Display = document.getElementById('limit2Display');
    const limit3Start = document.getElementById('limit3Start');
    const limit3Display = document.getElementById('limit3Display');
    const limit4Display = document.getElementById('limit4Display');
    
    if (limit1Display) limit1Display.textContent = t1.max;
    if (limit2Start) limit2Start.textContent = t2.min;
    if (limit2Display) limit2Display.textContent = t2.max;
    if (limit3Start) limit3Start.textContent = t3.min;
    if (limit3Display) limit3Display.textContent = t3.max;
    if (limit4Display) limit4Display.textContent = t4.min;
    
    const tranche1Limit = document.getElementById('tranche1Limit');
    const tranche1Price = document.getElementById('tranche1Price');
    const tranche2Limit = document.getElementById('tranche2Limit');
    const tranche2Price = document.getElementById('tranche2Price');
    const tranche3Limit = document.getElementById('tranche3Limit');
    const tranche3Price = document.getElementById('tranche3Price');
    const tranche4Limit = document.getElementById('tranche4Limit');
    const tranche4Price = document.getElementById('tranche4Price');
    
    if (tranche1Limit) tranche1Limit.value = t1.max;
    if (tranche1Price) tranche1Price.value = t1.price;
    if (tranche2Limit) tranche2Limit.value = t2.max;
    if (tranche2Price) tranche2Price.value = t2.price;
    if (tranche3Limit) tranche3Limit.value = t3.max;
    if (tranche3Price) tranche3Price.value = t3.price;
    if (tranche4Limit) tranche4Limit.value = t4.min;
    if (tranche4Price) tranche4Price.value = t4.price;
}

function saveTranchesFromInputs() {
    const t1Max = parseInt(document.getElementById('tranche1Limit')?.value) || 50;
    const t2Max = parseInt(document.getElementById('tranche2Limit')?.value) || 150;
    const t3Max = parseInt(document.getElementById('tranche3Limit')?.value) || 300;
    
    electricityTranches = [
        { min: 0, max: t1Max, price: parseFloat(document.getElementById('tranche1Price')?.value) || 450 },
        { min: t1Max + 1, max: t2Max, price: parseFloat(document.getElementById('tranche2Price')?.value) || 550 },
        { min: t2Max + 1, max: t3Max, price: parseFloat(document.getElementById('tranche3Price')?.value) || 650 },
        { min: t3Max + 1, max: Infinity, price: parseFloat(document.getElementById('tranche4Price')?.value) || 750 }
    ];
}

function addTranche() {
    trancheCounter++;
    const lastTranche = electricityTranches[electricityTranches.length - 1];
    const newTrancheMin = lastTranche.min;
    const newTranche = {
        id: trancheCounter,
        min: newTrancheMin,
        max: newTrancheMin + 100,
        price: 800
    };
    extraTranches.push(newTranche);
    
    const container = document.getElementById('extraTranches');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'form-group extra-tranche';
    div.id = `tranche-${trancheCounter}`;
    div.innerHTML = `
        <label>Tranche ${trancheCounter} - De <span id="extraLimitStart-${trancheCounter}">${newTranche.min}</span> à <span id="extraLimitEnd-${trancheCounter}">${newTranche.max}</span> kWh</label>
        <div class="tranche-inputs">
            <input type="number" id="extraTrancheMax-${trancheCounter}" step="1" value="${newTranche.max}" class="premium-input" style="width: 45%;" onchange="updateExtraTranche(${trancheCounter})">
            <span>→</span>
            <input type="number" id="extraTranchePrice-${trancheCounter}" step="10" value="${newTranche.price}" class="premium-input" style="width: 45%;" onchange="updateExtraTranche(${trancheCounter})">
            <span>Ar/kWh</span>
            <button type="button" class="btn-icon delete" onclick="removeTranche(${trancheCounter})" style="margin-left: 10px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    
    updateExtraTrancheDisplay(trancheCounter);
    showNotification('Tranche ajoutée', 'success');
}

function updateExtraTranche(id) {
    const extra = extraTranches.find(t => t.id === id);
    if (extra) {
        const maxInput = document.getElementById(`extraTrancheMax-${id}`);
        const priceInput = document.getElementById(`extraTranchePrice-${id}`);
        if (maxInput) extra.max = parseInt(maxInput.value);
        if (priceInput) extra.price = parseFloat(priceInput.value);
        updateExtraTrancheDisplay(id);
    }
}

function updateExtraTrancheDisplay(id) {
    const extra = extraTranches.find(t => t.id === id);
    if (extra) {
        const startSpan = document.getElementById(`extraLimitStart-${id}`);
        const endSpan = document.getElementById(`extraLimitEnd-${id}`);
        if (startSpan) startSpan.textContent = extra.min;
        if (endSpan) endSpan.textContent = extra.max;
    }
}

function removeTranche(id) {
    extraTranches = extraTranches.filter(t => t.id !== id);
    const element = document.getElementById(`tranche-${id}`);
    if (element) element.remove();
    showNotification('Tranche supprimée', 'success');
}

function calculateElectricityCost(consumptionKwh) {
    if (elecTarifMethod === 'simple') {
        return consumptionKwh * pricePerKwhSimple;
    }
    
    let remaining = consumptionKwh;
    let totalCost = 0;
    let allTranches = [...electricityTranches, ...extraTranches];
    allTranches.sort((a, b) => a.min - b.min);
    
    for (let tranche of allTranches) {
        if (remaining <= 0) break;
        
        let trancheSize = tranche.max - tranche.min + 1;
        if (tranche.max === Infinity || isNaN(tranche.max)) {
            totalCost += remaining * tranche.price;
            break;
        }
        
        let consumptionInTranche = Math.min(remaining, trancheSize);
        totalCost += consumptionInTranche * tranche.price;
        remaining -= consumptionInTranche;
    }
    
    return totalCost;
}

// Initialisation de l'aperçu consommation
function initConsumptionPreview() {
    const powerInput = document.getElementById('appliancePower');
    const hoursInput = document.getElementById('applianceHours');
    const daysInput = document.getElementById('applianceDays');
    const previewSpan = document.getElementById('consumptionPreview');
    
    function updatePreview() {
        const power = parseFloat(powerInput?.value) || 0;
        const hours = parseFloat(hoursInput?.value) || 0;
        const days = parseFloat(daysInput?.value) || 0;
        const consumption = (power * hours * days) / 1000;
        
        if (previewSpan) {
            previewSpan.textContent = `${consumption.toFixed(2)} kWh/mois`;
        }
    }
    
    if (powerInput) powerInput.addEventListener('input', updatePreview);
    if (hoursInput) hoursInput.addEventListener('input', updatePreview);
    if (daysInput) daysInput.addEventListener('input', updatePreview);
    
    updatePreview();
}

// Initialisation FAQ Accordéon
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        }
    });
}

// Configuration des événements
function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    const periodSelect = document.getElementById('period');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            currentPeriod = e.target.value;
            updateDashboard();
            updateBilling();
            updateHeaderStats();
            showNotification('Période changée avec succès', 'success');
        });
    }
    
    const personForm = document.getElementById('personForm');
    if (personForm) {
        personForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePerson();
        });
    }
    
    const coeffSlider = document.getElementById('personCoefficientSlider');
    if (coeffSlider) {
        coeffSlider.addEventListener('input', (e) => {
            const coeffValue = document.getElementById('coefficientValue');
            if (coeffValue) coeffValue.textContent = Math.round(e.target.value * 100) + '%';
        });
    }
    
    const applianceForm = document.getElementById('applianceForm');
    if (applianceForm) {
        applianceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAppliance();
        });
    }
    
    const applianceType = document.getElementById('applianceType');
    if (applianceType) {
        applianceType.addEventListener('change', (e) => {
            const personSelectGroup = document.getElementById('personSelectGroup');
            if (personSelectGroup) {
                personSelectGroup.style.display = e.target.value === 'individual' ? 'block' : 'none';
            }
        });
    }
    
    const elecMethodSelect = document.getElementById('elecMethod');
    const waterMethodSelect = document.getElementById('waterMethod');
    
    if (elecMethodSelect) {
        elecMethodSelect.addEventListener('change', (e) => {
            elecMethod = e.target.value;
            updateBilling();
            updateDashboard();
        });
    }
    
    if (waterMethodSelect) {
        waterMethodSelect.addEventListener('change', (e) => {
            waterMethod = e.target.value;
            updateBilling();
            updateDashboard();
        });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
    
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (tabId === 'billing') updateBilling();
    if (tabId === 'history') updateHistory();
}

function updateHeaderStats() {
    const totalPersons = persons.length;
    const charges = getTotalCharges();
    const totalBudget = charges.reduce((sum, c) => sum + c.totalCost, 0);
    
    const headerPersonCount = document.getElementById('headerPersonCount');
    const headerTotalBudget = document.getElementById('headerTotalBudget');
    const currentPeriodSpan = document.getElementById('currentPeriod');
    
    if (headerPersonCount) headerPersonCount.textContent = totalPersons;
    if (headerTotalBudget) headerTotalBudget.textContent = `${totalBudget.toFixed(0)} Ar`;
    
    const period = document.getElementById('period').value;
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [year, month] = period.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    if (currentPeriodSpan) currentPeriodSpan.textContent = `${monthName} ${year}`;
}

// Gestion des personnes
function showPersonModal(personId = null) {
    const modal = document.getElementById('personModal');
    const title = document.getElementById('personModalTitle');
    
    if (personId !== null) {
        const person = persons.find(p => p.id === personId);
        if (person) {
            title.innerHTML = '<i class="fas fa-user-edit"></i> Modifier un colocataire';
            document.getElementById('personId').value = person.id;
            document.getElementById('personName').value = person.name;
            document.getElementById('personEmail').value = person.email || '';
            document.getElementById('personPhone').value = person.phone || '';
            document.getElementById('personCoefficientSlider').value = person.coefficient;
            document.getElementById('coefficientValue').textContent = Math.round(person.coefficient * 100) + '%';
        }
    } else {
        title.innerHTML = '<i class="fas fa-user-plus"></i> Ajouter un colocataire';
        document.getElementById('personForm').reset();
        document.getElementById('personId').value = '';
        document.getElementById('personCoefficientSlider').value = 1;
        document.getElementById('coefficientValue').textContent = '100%';
    }
    
    modal.style.display = 'block';
}

function closePersonModal() {
    document.getElementById('personModal').style.display = 'none';
}

function savePerson() {
    const id = document.getElementById('personId').value;
    const personData = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('personName').value,
        email: document.getElementById('personEmail').value,
        phone: document.getElementById('personPhone').value,
        coefficient: parseFloat(document.getElementById('personCoefficientSlider').value)
    };
    
    if (!personData.name) {
        showNotification('Veuillez entrer un nom', 'error');
        return;
    }
    
    if (id) {
        const index = persons.findIndex(p => p.id === parseInt(id));
        persons[index] = personData;
        showNotification('Colocataire modifié avec succès', 'success');
    } else {
        persons.push(personData);
        showNotification('Colocataire ajouté avec succès', 'success');
    }
    
    saveData();
    updatePersonsList();
    updateDashboard();
    updateBilling();
    closePersonModal();
}

function deletePerson(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
        persons = persons.filter(p => p.id !== id);
        appliances = appliances.filter(a => a.personId !== id);
        saveData();
        updatePersonsList();
        updateAppliancesList();
        updateDashboard();
        updateBilling();
        showNotification('Colocataire supprimé', 'success');
    }
}

function updatePersonsList() {
    const container = document.getElementById('personsList');
    if (!container) return;
    
    if (persons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">Aucun colocataire enregistré</p>';
        return;
    }
    
    container.innerHTML = persons.map(person => `
        <div class="person-card">
            <h3><i class="fas fa-user-circle"></i> ${escapeHtml(person.name)}</h3>
            <p><i class="fas fa-envelope"></i> ${escapeHtml(person.email || 'Non renseigné')}</p>
            <p><i class="fas fa-phone"></i> ${escapeHtml(person.phone || 'Non renseigné')}</p>
            <p><i class="fas fa-chart-line"></i> Présence: ${person.coefficient * 100}%</p>
            <div class="card-actions">
                <button class="btn-icon edit" onclick="showPersonModal(${person.id})">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn-icon delete" onclick="deletePerson(${person.id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');
    
    updatePersonSelect();
}

function updatePersonSelect() {
    const select = document.getElementById('appliancePersonId');
    if (select) {
        select.innerHTML = persons.map(person => 
            `<option value="${person.id}">${escapeHtml(person.name)}</option>`
        ).join('');
    }
}

// Gestion des appareils
function showApplianceModal(applianceId = null) {
    const modal = document.getElementById('applianceModal');
    const title = document.getElementById('applianceModalTitle');
    
    updatePersonSelect();
    
    if (applianceId !== null) {
        const appliance = appliances.find(a => a.id === applianceId);
        if (appliance) {
            title.innerHTML = '<i class="fas fa-edit"></i> Modifier un appareil';
            document.getElementById('applianceId').value = appliance.id;
            document.getElementById('applianceName').value = appliance.name;
            document.getElementById('appliancePower').value = appliance.power;
            document.getElementById('applianceHours').value = appliance.hoursPerDay;
            document.getElementById('applianceDays').value = appliance.daysPerMonth;
            document.getElementById('applianceType').value = appliance.type;
            document.getElementById('appliancePersonId').value = appliance.personId || '';
            document.getElementById('applianceCategory').value = appliance.category;
            
            const personSelectGroup = document.getElementById('personSelectGroup');
            if (personSelectGroup) {
                personSelectGroup.style.display = appliance.type === 'individual' ? 'block' : 'none';
            }
            
            setTimeout(initConsumptionPreview, 100);
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un appareil';
        document.getElementById('applianceForm').reset();
        document.getElementById('applianceId').value = '';
        document.getElementById('applianceType').value = 'individual';
        const personSelectGroup = document.getElementById('personSelectGroup');
        if (personSelectGroup) personSelectGroup.style.display = 'block';
        setTimeout(initConsumptionPreview, 100);
    }
    
    modal.style.display = 'block';
}

function closeApplianceModal() {
    document.getElementById('applianceModal').style.display = 'none';
}

function saveAppliance() {
    const id = document.getElementById('applianceId').value;
    const applianceData = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('applianceName').value,
        power: parseFloat(document.getElementById('appliancePower').value),
        hoursPerDay: parseFloat(document.getElementById('applianceHours').value),
        daysPerMonth: parseInt(document.getElementById('applianceDays').value),
        type: document.getElementById('applianceType').value,
        personId: document.getElementById('applianceType').value === 'individual' ? 
                  parseInt(document.getElementById('appliancePersonId').value) : null,
        category: document.getElementById('applianceCategory').value
    };
    
    if (!applianceData.name || !applianceData.power) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    applianceData.consumption = (applianceData.power * applianceData.hoursPerDay * applianceData.daysPerMonth) / 1000;
    
    if (id) {
        const index = appliances.findIndex(a => a.id === parseInt(id));
        appliances[index] = applianceData;
        showNotification('Appareil modifié avec succès', 'success');
    } else {
        appliances.push(applianceData);
        showNotification('Appareil ajouté avec succès', 'success');
    }
    
    saveData();
    updateAppliancesList();
    updateDashboard();
    updateBilling();
    closeApplianceModal();
}

function deleteAppliance(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
        appliances = appliances.filter(a => a.id !== id);
        saveData();
        updateAppliancesList();
        updateDashboard();
        updateBilling();
        showNotification('Appareil supprimé', 'success');
    }
}

function importDefaultAppliances() {
    const defaultAppliances = [
        { name: 'Réfrigérateur', power: 150, hoursPerDay: 24, daysPerMonth: 30, type: 'shared', category: 'electromenager' },
        { name: 'Téléviseur', power: 100, hoursPerDay: 5, daysPerMonth: 30, type: 'shared', category: 'multimedia' },
        { name: 'Lave-linge', power: 2000, hoursPerDay: 1, daysPerMonth: 8, type: 'shared', category: 'electromenager' },
        { name: 'Ampoule LED', power: 10, hoursPerDay: 6, daysPerMonth: 30, type: 'shared', category: 'eclairage' },
        { name: 'Ordinateur', power: 200, hoursPerDay: 4, daysPerMonth: 22, type: 'individual', category: 'multimedia' }
    ];
    
    defaultAppliances.forEach(app => {
        const consumption = (app.power * app.hoursPerDay * app.daysPerMonth) / 1000;
        appliances.push({
            id: Date.now() + Math.random(),
            ...app,
            consumption: consumption,
            personId: app.type === 'individual' && persons[0] ? persons[0].id : null
        });
    });
    
    saveData();
    updateAppliancesList();
    updateDashboard();
    updateBilling();
    showNotification('Appareils importés avec succès !', 'success');
}

function updateAppliancesList() {
    const container = document.getElementById('appliancesList');
    if (!container) return;
    
    if (appliances.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">Aucun appareil enregistré</p>';
        return;
    }
    
    container.innerHTML = appliances.map(appliance => {
        const consumption = appliance.consumption.toFixed(2);
        const cost = calculateElectricityCost(appliance.consumption).toFixed(0);
        const person = appliance.personId ? persons.find(p => p.id === appliance.personId) : null;
        
        return `
            <div class="appliance-card">
                <h3><i class="fas fa-plug"></i> ${escapeHtml(appliance.name)}</h3>
                <p><i class="fas fa-bolt"></i> Puissance: ${appliance.power} W</p>
                <p><i class="fas fa-clock"></i> ${appliance.hoursPerDay}h/jour, ${appliance.daysPerMonth} jours/mois</p>
                <p><i class="fas fa-chart-line"></i> Consommation: ${consumption} kWh/mois</p>
                <p><i class="fas fa-euro-sign"></i> Coût: ${cost} Ar</p>
                <p><i class="fas fa-tag"></i> Type: ${appliance.type === 'individual' ? 'Individuel' : 'Partagé'}</p>
                ${person ? `<p><i class="fas fa-user"></i> Assigné à: ${escapeHtml(person.name)}</p>` : ''}
                <div class="card-actions">
                    <button class="btn-icon edit" onclick="showApplianceModal(${appliance.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-icon delete" onclick="deleteAppliance(${appliance.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Calcul des charges
function calculateElectricityCharges() {
    const totalPersonsCoefficient = persons.reduce((sum, p) => sum + p.coefficient, 0);
    const results = [];
    
    if (elecMethod === 'basedOnBill' && elecBillAmount > 0) {
        const totalCost = elecBillAmount;
        
        persons.forEach(person => {
            const share = totalPersonsCoefficient > 0 ? (totalCost / totalPersonsCoefficient) * person.coefficient : 0;
            results.push({
                personId: person.id,
                personName: person.name,
                coefficient: person.coefficient,
                individualCost: 0,
                sharedCost: share,
                totalElectricity: share
            });
        });
    } else {
        persons.forEach(person => {
            let individualCost = 0;
            let sharedCost = 0;
            
            const individualAppliances = appliances.filter(a => a.type === 'individual' && a.personId === person.id);
            individualAppliances.forEach(appliance => {
                individualCost += calculateElectricityCost(appliance.consumption);
            });
            
            const sharedAppliances = appliances.filter(a => a.type === 'shared');
            sharedAppliances.forEach(appliance => {
                const cost = calculateElectricityCost(appliance.consumption) / (totalPersonsCoefficient || 1);
                sharedCost += cost * person.coefficient;
            });
            
            results.push({
                personId: person.id,
                personName: person.name,
                coefficient: person.coefficient,
                individualCost: individualCost,
                sharedCost: sharedCost,
                totalElectricity: individualCost + sharedCost
            });
        });
    }
    
    return results;
}

function calculateWaterCharges() {
    const totalCoefficient = persons.reduce((sum, p) => sum + p.coefficient, 0);
    
    if (waterMethod === 'basedOnConsumption' && waterConsumption > 0) {
        const totalWaterCost = waterBillAmount > 0 ? waterBillAmount : waterConsumption * pricePerM3;
        return persons.map(person => ({
            personId: person.id,
            personName: person.name,
            coefficient: person.coefficient,
            waterCost: totalCoefficient > 0 ? (totalWaterCost / totalCoefficient) * person.coefficient : 0
        }));
    } else {
        const totalWaterCost = waterBillAmount > 0 ? waterBillAmount : waterConsumption * pricePerM3;
        return persons.map(person => ({
            personId: person.id,
            personName: person.name,
            coefficient: person.coefficient,
            waterCost: persons.length > 0 ? totalWaterCost / persons.length : 0
        }));
    }
}

function getTotalCharges() {
    const elecCharges = calculateElectricityCharges();
    const waterCharges = calculateWaterCharges();
    
    return persons.map(person => {
        const elec = elecCharges.find(e => e.personId === person.id);
        const water = waterCharges.find(w => w.personId === person.id);
        
        return {
            personId: person.id,
            personName: person.name,
            electricityCost: elec ? elec.totalElectricity : 0,
            waterCost: water ? water.waterCost : 0,
            totalCost: (elec ? elec.totalElectricity : 0) + (water ? water.waterCost : 0)
        };
    });
}

// Mise à jour du Dashboard
function updateDashboard() {
    const totalPersonsElem = document.getElementById('totalPersons');
    const totalAppliancesElem = document.getElementById('totalAppliances');
    const totalElecConsumptionElem = document.getElementById('totalElecConsumption');
    const totalWaterConsumptionElem = document.getElementById('totalWaterConsumption');
    
    if (totalPersonsElem) totalPersonsElem.textContent = persons.length;
    if (totalAppliancesElem) totalAppliancesElem.textContent = appliances.length;
    
    const totalConsumption = appliances.reduce((sum, a) => sum + a.consumption, 0);
    if (totalElecConsumptionElem) totalElecConsumptionElem.textContent = `${totalConsumption.toFixed(2)} kWh`;
    if (totalWaterConsumptionElem) totalWaterConsumptionElem.textContent = `${waterConsumption} m³`;
    
    updateCharts();
    updateAlerts();
    updateTips();
    updateHeaderStats();
}

function updateCharts() {
    const elecCharges = calculateElectricityCharges();
    const elecCtx = document.getElementById('elecChart');
    
    if (elecCtx && elecCharges.length > 0) {
        if (elecChart) elecChart.destroy();
        
        elecChart = new Chart(elecCtx, {
            type: 'doughnut',
            data: {
                labels: elecCharges.map(c => c.personName),
                datasets: [{
                    data: elecCharges.map(c => c.totalElectricity),
                    backgroundColor: ['#00d4ff', '#0099cc', '#33ddff', '#66e6ff', '#99eeff'],
                    borderWidth: 0,
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000,
                        easing: 'easeOutBounce'
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'white', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw.toFixed(0)} Ar`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    const topAppliances = [...appliances].sort((a, b) => b.consumption - a.consumption).slice(0, 5);
    const appCtx = document.getElementById('appliancesChart');
    
    if (appCtx && topAppliances.length > 0) {
        if (appliancesChart) appliancesChart.destroy();
        
        appliancesChart = new Chart(appCtx, {
            type: 'bar',
            data: {
                labels: topAppliances.map(a => a.name),
                datasets: [{
                    label: 'Consommation (kWh)',
                    data: topAppliances.map(a => a.consumption),
                    backgroundColor: '#00d4ff',
                    borderRadius: 8,
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart',
                        delay: (context) => context.dataIndex * 100
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kWh',
                            color: 'white'
                        },
                        ticks: { color: 'white', stepSize: 50 },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: 'white' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'white', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Consommation: ${context.raw.toFixed(2)} kWh`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutCubic'
                }
            }
        });
    }
    
    animateCharts();
}

function animateCharts() {
    const charts = document.querySelectorAll('.chart-card canvas');
    charts.forEach((chart, index) => {
        chart.style.animation = `chartFadeIn 0.5s ease-out ${index * 0.2}s forwards`;
        chart.style.opacity = '0';
    });
}

function updateAlerts() {
    const alertsContainer = document.getElementById('alertsList');
    if (!alertsContainer) return;
    
    const alerts = [];
    const totalConsumption = appliances.reduce((sum, a) => sum + a.consumption, 0);
    
    if (totalConsumption > 500) {
        alerts.push('<i class="fas fa-exclamation-triangle"></i> ⚠️ Consommation électrique élevée (>500 kWh)');
    }
    
    const highPowerAppliances = appliances.filter(a => a.power > 2000);
    if (highPowerAppliances.length > 0) {
        alerts.push(`<i class="fas fa-fire"></i> 🔥 ${highPowerAppliances.length} appareil(s) énergivore(s) détecté(s)`);
    }
    
    if (elecBillAmount === 0 && waterBillAmount === 0 && persons.length > 0) {
        alerts.push('<i class="fas fa-file-invoice"></i> 💡 Pensez à saisir vos factures JIRAMA dans les paramètres');
    }
    
    if (persons.length === 0) {
        alerts.push('<i class="fas fa-users"></i> 👥 Ajoutez des colocataires pour commencer');
    }
    
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p><i class="fas fa-check-circle"></i> ✅ Tout est en ordre !</p>';
    } else {
        alertsContainer.innerHTML = alerts.map(alert => `<p>${alert}</p>`).join('');
    }
}

function updateTips() {
    const tipsContainer = document.getElementById('tipsList');
    if (!tipsContainer) return;
    
    const tips = [
        '<i class="fas fa-lightbulb"></i> Éteignez les appareils en veille pour économiser jusqu\'à 10%',
        '<i class="fas fa-temperature-low"></i> ❄️ Dégivrez régulièrement votre réfrigérateur',
        '<i class="fas fa-water"></i> 💧 Réparez les fuites d\'eau, une goutte/seconde = 15L/jour',
        '<i class="fas fa-charging-station"></i> 🔌 Débranchez les chargeurs inutilisés',
        '<i class="fas fa-sun"></i> ☀️ Utilisez la lumière naturelle autant que possible'
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    tipsContainer.innerHTML = `<p>${randomTip}</p>`;
}

// Mise à jour de la facturation
function updateBilling() {
    const charges = getTotalCharges();
    const total = charges.reduce((sum, c) => sum + c.totalCost, 0);
    const totalChargesElem = document.getElementById('totalCharges');
    if (totalChargesElem) totalChargesElem.textContent = `${total.toFixed(0)} Ar`;
    
    const container = document.getElementById('billingDetails');
    if (!container) return;
    
    if (charges.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Aucune donnée à afficher</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="billing-table">
            <thead>
                <tr>
                    <th>Colocataire</th>
                    <th>Électricité (Ar)</th>
                    <th>Eau (Ar)</th>
                    <th>Total (Ar)</th>
                    <th>Statut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${charges.map(charge => `
                    <tr>
                        <td><strong>${escapeHtml(charge.personName)}</strong></td>
                        <td>${charge.electricityCost.toFixed(0)} Ar</td>
                        <td>${charge.waterCost.toFixed(0)} Ar</td>
                        <td><strong>${charge.totalCost.toFixed(0)} Ar</strong></td>
                        <td>
                            <span class="unpaid-badge" id="status-${charge.personId}">
                                Non payé
                            </span>
                        </td>
                        <td>
                            <button class="btn-glow" onclick="markAsPaid(${charge.personId})" 
                                    style="padding: 5px 15px; font-size: 12px;">
                                <i class="fas fa-check"></i> Payé
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function markAsPaid(personId) {
    const statusSpan = document.getElementById(`status-${personId}`);
    if (statusSpan) {
        statusSpan.className = 'paid-badge';
        statusSpan.textContent = 'Payé';
        
        const period = document.getElementById('period').value;
        const person = persons.find(p => p.id === personId);
        const charges = getTotalCharges();
        const charge = charges.find(c => c.personId === personId);
        
        if (charge && person) {
            history.unshift({
                date: new Date().toISOString(),
                period: period,
                personName: person.name,
                amount: charge.totalCost,
                type: 'paiement'
            });
            saveData();
            updateHistory();
        }
        
        showNotification('Paiement enregistré avec succès !', 'success');
    }
}

function generateInvoice() {
    if (persons.length === 0) {
        showNotification('Ajoutez des colocataires avant de générer une facture', 'error');
        return;
    }
    
    const charges = getTotalCharges();
    const total = charges.reduce((sum, c) => sum + c.totalCost, 0);
    const period = document.getElementById('period').value;
    const date = new Date().toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [year, month] = period.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    // Calcul des pourcentages
    const chargesWithPercent = charges.map(c => ({
        ...c,
        percent: total > 0 ? (c.totalCost / total) * 100 : 0
    }));
    
    const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Facture JIRAMA - ${monthName} ${year}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                    background: white;
                    padding: 15px;
                    font-size: 9px;
                }
                .invoice-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                    overflow: hidden;
                }
                /* Header - IDENTIQUE AU SITE WEB */
                .invoice-header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    padding: 20px 25px;
                    color: white;
                    text-align: center;
                    border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                    position: relative;
                }
                .logo-area {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 10px;
                }
                /* Logo identique au site web */
                .logo-icon {
                    width: 55px;
                    height: 55px;
                    background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 153, 204, 0.2));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(0, 212, 255, 0.3);
                    position: relative;
                }
                .logo-icon svg {
                    width: 40px;
                    height: 40px;
                }
                .logo-text h1 {
                    font-size: 26px;
                    margin: 0;
                    letter-spacing: -0.5px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #00d4ff, #fff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .logo-text h1 span {
                    font-weight: 300;
                    background: none;
                    -webkit-text-fill-color: white;
                    color: white;
                }
                .logo-text p {
                    margin: 2px 0 0;
                    opacity: 0.8;
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.8);
                }
                .invoice-title {
                    margin-top: 8px;
                }
                .invoice-title h2 {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: 1px;
                    color: white;
                }
                .invoice-title p {
                    margin-top: 4px;
                    opacity: 0.9;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.8);
                }
                .invoice-badge {
                    background: rgba(0, 212, 255, 0.2);
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 25px;
                    font-size: 9px;
                    margin-top: 6px;
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    color: rgba(255, 255, 255, 0.9);
                }
                /* Section informations */
                .info-section {
                    display: flex;
                    gap: 15px;
                    padding: 15px 20px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                .info-card {
                    flex: 1;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 10px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }
                .info-card h3 {
                    color: #1e3c72;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .info-card p {
                    margin: 3px 0;
                    color: #334155;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                }
                .total-amount {
                    font-size: 18px;
                    font-weight: bold;
                    color: #10b981;
                    text-align: right;
                }
                /* Tableau */
                .table-section {
                    padding: 12px 20px;
                }
                .table-section h3 {
                    color: #1e3c72;
                    margin-bottom: 8px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    font-size: 9px;
                    border: 1px solid #e2e8f0;
                }
                .invoice-table th {
                    background: #1e3c72;
                    color: white;
                    padding: 6px 8px;
                    text-align: left;
                    font-weight: 600;
                }
                .invoice-table td {
                    padding: 5px 8px;
                    border-bottom: 1px solid #e2e8f0;
                    color: #334155;
                }
                .invoice-table tr:last-child td {
                    border-bottom: none;
                }
                .total-row {
                    background: #f1f5f9;
                    font-weight: bold;
                }
                .amount {
                    text-align: right;
                    font-family: monospace;
                }
                /* Barres de progression */
                .progress-section {
                    padding: 8px 20px 15px;
                }
                .progress-section h3 {
                    color: #1e3c72;
                    margin-bottom: 8px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .progress-item {
                    margin-bottom: 6px;
                }
                .progress-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2px;
                    font-size: 8px;
                    color: #475569;
                }
                .progress-bar-bg {
                    background: #e2e8f0;
                    border-radius: 4px;
                    height: 5px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    background: linear-gradient(90deg, #00d4ff, #0099cc);
                    height: 100%;
                    border-radius: 4px;
                }
                /* Footer */
                .invoice-footer {
                    background: #0a0e27;
                    padding: 10px 20px;
                    color: #94a3b8;
                    text-align: center;
                    font-size: 8px;
                    border-top: 1px solid rgba(0, 212, 255, 0.2);
                }
                .footer-links {
                    margin-top: 6px;
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .footer-links span {
                    color: rgba(255, 255, 255, 0.6);
                }
                @media print {
                    body {
                        padding: 0;
                        background: white;
                    }
                    .invoice-container {
                        box-shadow: none;
                        border-radius: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header IDENTIQUE AU SITE WEB -->
                <div class="invoice-header">
                    <div class="logo-area">
                        <div class="logo-icon">
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="45" fill="white" stroke="#00d4ff" stroke-width="2"/>
                                <path d="M50 20 L50 80 M35 35 L65 35 M35 65 L65 65" stroke="#00d4ff" stroke-width="4" stroke-linecap="round"/>
                                <path d="M30 50 L70 50" stroke="#00d4ff" stroke-width="4" stroke-linecap="round"/>
                                <circle cx="50" cy="50" r="8" fill="#00d4ff"/>
                                <text x="50" y="68" text-anchor="middle" fill="#00d4ff" font-size="12" font-weight="bold">JIRAMA</text>
                            </svg>
                        </div>
                        <div class="logo-text">
                            <h1>JIRAMA <span>Charge Manager</span></h1>
                            <p>Gestion intelligente des charges d'électricité et d'eau</p>
                        </div>
                    </div>
                    <div class="invoice-title">
                        <h2>FACTURE DES CHARGES</h2>
                        <p>Période : ${monthName} ${year}</p>
                        <div class="invoice-badge">
                            <i class="fas fa-calendar-alt"></i> Émise le ${date}
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-card">
                        <h3><i class="fas fa-charging-station"></i> Détails JIRAMA</h3>
                        <p><strong>Électricité :</strong> <span>${elecBillAmount.toFixed(0)} Ar</span></p>
                        <p><strong>Eau :</strong> <span>${waterBillAmount.toFixed(0)} Ar</span></p>
                        <p><strong>Total factures :</strong> <span class="total-amount">${(elecBillAmount + waterBillAmount).toFixed(0)} Ar</span></p>
                    </div>
                    <div class="info-card">
                        <h3><i class="fas fa-info-circle"></i> Informations</h3>
                        <p><strong>Colocataires :</strong> <span>${persons.length}</span></p>
                        <p><strong>Total charges :</strong> <span class="total-amount">${total.toFixed(0)} Ar</span></p>
                        <p><strong>Échéance :</strong> <span>${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('fr-FR')}</span></p>
                    </div>
                </div>
                
                <div class="table-section">
                    <h3><i class="fas fa-users"></i> Répartition par colocataire</h3>
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Colocataire</th>
                                <th>Électricité (Ar)</th>
                                <th>Eau (Ar)</th>
                                <th>Total (Ar)</th>
                                <th>Part</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chargesWithPercent.map(charge => `
                                <tr>
                                    <td><strong>${escapeHtml(charge.personName)}</strong></td>
                                    <td class="amount">${charge.electricityCost.toFixed(0)} Ar</td>
                                    <td class="amount">${charge.waterCost.toFixed(0)} Ar</td>
                                    <td class="amount"><strong>${charge.totalCost.toFixed(0)} Ar</strong></td>
                                    <td class="amount">${charge.percent.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td><strong>TOTAL</strong></td>
                                <td class="amount"><strong>${charges.reduce((sum, c) => sum + c.electricityCost, 0).toFixed(0)} Ar</strong></td>
                                <td class="amount"><strong>${charges.reduce((sum, c) => sum + c.waterCost, 0).toFixed(0)} Ar</strong></td>
                                <td class="amount"><strong>${total.toFixed(0)} Ar</strong></td>
                                <td class="amount"><strong>100%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="progress-section">
                    <h3><i class="fas fa-chart-pie"></i> Répartition visuelle</h3>
                    ${chargesWithPercent.map(charge => `
                        <div class="progress-item">
                            <div class="progress-label">
                                <span>${escapeHtml(charge.personName)}</span>
                                <span>${charge.totalCost.toFixed(0)} Ar (${charge.percent.toFixed(1)}%)</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${charge.percent}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="invoice-footer">
                    <p>Facture générée automatiquement par JIRAMA Charge Manager - Merci de régler avant échéance</p>
                    <div class="footer-links">
                        <span><i class="fas fa-phone"></i> +261 34 30 000 30</span>
                        <span><i class="fas fa-envelope"></i> support@jirama.mg</span>
                        <span><i class="fas fa-globe"></i> www.jirama.mg</span>
                    </div>
                    <p style="margin-top: 5px; font-size: 7px;">Ce document fait foi de facture</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const element = document.createElement('div');
    element.innerHTML = invoiceHTML;
    
    html2pdf().from(element).set({
        margin: 0.2,
        filename: `facture_JIRAMA_${monthName}_${year}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.5, letterRendering: true },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
    }).save();
    
    history.unshift({
        date: new Date().toISOString(),
        period: period,
        type: 'facture',
        total: total
    });
    saveData();
    updateHistory();
    
    showNotification('Facture générée avec succès !', 'success');
}

function shareBill() {
    if (persons.length === 0) {
        showNotification('Ajoutez des colocataires avant de partager', 'error');
        return;
    }
    
    const charges = getTotalCharges();
    const total = charges.reduce((sum, c) => sum + c.totalCost, 0);
    const period = document.getElementById('period').value;
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [year, month] = period.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    let message = `📄 *Facture des charges - ${monthName} ${year}*\n\n`;
    charges.forEach(charge => {
        message += `👤 ${charge.personName}:\n`;
        message += `   ⚡ Électricité: ${charge.electricityCost.toFixed(0)} Ar\n`;
        message += `   💧 Eau: ${charge.waterCost.toFixed(0)} Ar\n`;
        message += `   💰 Total: ${charge.totalCost.toFixed(0)} Ar\n\n`;
    });
    message += `📊 *Total général: ${total.toFixed(0)} Ar*`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Facture des charges',
            text: message
        }).catch(() => {
            navigator.clipboard.writeText(message);
            showNotification('Facture copiée dans le presse-papier !', 'success');
        });
    } else {
        navigator.clipboard.writeText(message);
        showNotification('Facture copiée dans le presse-papier !', 'success');
    }
}

function showNotification(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-content">
            <strong>${type === 'success' ? 'Succès' : 'Information'}</strong>
            <p>${message}</p>
        </div>
        <div class="toast-progress"></div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Paramètres
function saveSettings() {
    const elecBillInput = document.getElementById('elecBillAmount');
    const waterBillInput = document.getElementById('waterBillAmount');
    const elecConsumptionInput = document.getElementById('elecConsumption');
    const waterConsumptionInput = document.getElementById('waterConsumption');
    const priceM3Input = document.getElementById('pricePerM3');
    const elecMethodSelect = document.getElementById('elecMethod');
    const waterMethodSelect = document.getElementById('waterMethod');
    const tarifMethodSelect = document.getElementById('elecTarifMethod');
    
    if (elecBillInput) elecBillAmount = parseFloat(elecBillInput.value) || 0;
    if (waterBillInput) waterBillAmount = parseFloat(waterBillInput.value) || 0;
    if (elecConsumptionInput) elecConsumption = parseFloat(elecConsumptionInput.value) || 0;
    if (waterConsumptionInput) waterConsumption = parseFloat(waterConsumptionInput.value) || 0;
    if (priceM3Input) pricePerM3 = parseFloat(priceM3Input.value) || 2500;
    if (elecMethodSelect) elecMethod = elecMethodSelect.value;
    if (waterMethodSelect) waterMethod = waterMethodSelect.value;
    
    if (tarifMethodSelect) {
        elecTarifMethod = tarifMethodSelect.value;
    }
    
    if (elecTarifMethod === 'simple') {
        const simplePrice = document.getElementById('pricePerKwhSimple');
        if (simplePrice) pricePerKwhSimple = parseFloat(simplePrice.value) || 550;
    } else {
        saveTranchesFromInputs();
    }
    
    saveData();
    updateDashboard();
    updateBilling();
    showNotification('Paramètres sauvegardés avec succès !', 'success');
}

function loadSettings() {
    const elecBillInput = document.getElementById('elecBillAmount');
    const waterBillInput = document.getElementById('waterBillAmount');
    const elecConsumptionInput = document.getElementById('elecConsumption');
    const waterConsumptionInput = document.getElementById('waterConsumption');
    const priceM3Input = document.getElementById('pricePerM3');
    const elecMethodSelect = document.getElementById('elecMethod');
    const waterMethodSelect = document.getElementById('waterMethod');
    const tarifMethodSelect = document.getElementById('elecTarifMethod');
    const simplePriceInput = document.getElementById('pricePerKwhSimple');
    
    if (elecBillInput) elecBillInput.value = elecBillAmount;
    if (waterBillInput) waterBillInput.value = waterBillAmount;
    if (elecConsumptionInput) elecConsumptionInput.value = elecConsumption;
    if (waterConsumptionInput) waterConsumptionInput.value = waterConsumption;
    if (priceM3Input) priceM3Input.value = pricePerM3;
    if (elecMethodSelect) elecMethodSelect.value = elecMethod;
    if (waterMethodSelect) waterMethodSelect.value = waterMethod;
    if (tarifMethodSelect) tarifMethodSelect.value = elecTarifMethod;
    if (simplePriceInput) simplePriceInput.value = pricePerKwhSimple;
    
    updateTrancheDisplays();
}

function resetData() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
        persons = [];
        appliances = [];
        history = [];
        elecBillAmount = 0;
        waterBillAmount = 0;
        waterConsumption = 0;
        elecTarifMethod = 'simple';
        pricePerKwhSimple = 550;
        electricityTranches = [
            { min: 0, max: 50, price: 450 },
            { min: 51, max: 150, price: 550 },
            { min: 151, max: 300, price: 650 },
            { min: 301, max: Infinity, price: 750 }
        ];
        extraTranches = [];
        
        saveData();
        updatePersonsList();
        updateAppliancesList();
        updateDashboard();
        updateBilling();
        updateHistory();
        loadSettings();
        showNotification('Données réinitialisées avec succès', 'success');
    }
}

// Historique
function updateHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px;">Aucun historique disponible</p>';
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="history-item">
            <p><strong>📅 ${new Date(item.date).toLocaleDateString('fr-FR')}</strong> - ${item.period}</p>
            <p>${item.type === 'facture' ? '📄 Facture générée' : '💰 Paiement enregistré'}</p>
            ${item.personName ? `<p>👤 ${item.personName}</p>` : ''}
            ${item.amount ? `<p>💵 Montant: ${item.amount.toFixed(0)} Ar</p>` : ''}
            ${item.total ? `<p>📊 Total: ${item.total.toFixed(0)} Ar</p>` : ''}
        </div>
    `).join('');
}

function clearHistory() {
    if (confirm('Voulez-vous effacer tout l\'historique ?')) {
        history = [];
        saveData();
        updateHistory();
        showNotification('Historique effacé', 'success');
    }
}

function showBudgetSimulator() {
    if (persons.length === 0) {
        showNotification('Ajoutez des colocataires pour utiliser le simulateur', 'error');
        return;
    }
    
    const modal = document.getElementById('budgetModal');
    const charges = getTotalCharges();
    const total = charges.reduce((sum, c) => sum + c.totalCost, 0);
    const period = document.getElementById('period').value;
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [year, month] = period.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    const simulatorHTML = `
        <div style="padding: 20px;">
            <h4 style="color: white;">Répartition du budget - ${monthName} ${year}</h4>
            <canvas id="budgetChart" style="max-height: 300px; margin: 20px 0;"></canvas>
            <div class="budget-details">
                ${charges.map(charge => `
                    <div style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 12px;">
                        <strong style="color: #00d4ff;">${escapeHtml(charge.personName)}</strong><br>
                        <span style="color: white;">${((charge.totalCost / total) * 100).toFixed(1)}% du total</span>
                        <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; margin-top: 8px;">
                            <div style="background: #00d4ff; width: ${((charge.totalCost / total) * 100)}%; height: 8px; border-radius: 4px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #00d4ff, #0099cc); border-radius: 12px;">
                <h4 style="margin: 0; color: white;">Budget total mensuel</h4>
                <p style="font-size: 32px; font-weight: bold; margin: 10px 0 0; color: white;">${total.toFixed(0)} Ar</p>
            </div>
        </div>
    `;
    
    const budgetSimulator = document.getElementById('budgetSimulator');
    if (budgetSimulator) budgetSimulator.innerHTML = simulatorHTML;
    modal.style.display = 'block';
    
    setTimeout(() => {
        const ctx = document.getElementById('budgetChart');
        if (ctx) {
            if (budgetChart) budgetChart.destroy();
            budgetChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: charges.map(c => c.personName),
                    datasets: [{
                        data: charges.map(c => c.totalCost),
                        backgroundColor: ['#00d4ff', '#0099cc', '#33ddff', '#66e6ff', '#99eeff']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: 'white' }
                        }
                    }
                }
            });
        }
    }, 100);
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.style.display = 'none';
}

function refreshChart(type) {
    updateCharts();
    showNotification('Graphique actualisé', 'success');
}

function exportData() {
    if (persons.length === 0 && appliances.length === 0) {
        showNotification('Aucune donnée à exporter', 'error');
        return;
    }
    
    const data = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        persons: persons,
        appliances: appliances,
        settings: {
            elecTarifMethod,
            pricePerKwhSimple,
            electricityTranches,
            extraTranches,
            pricePerM3,
            elecBillAmount,
            waterBillAmount,
            elecMethod,
            waterMethod
        },
        history: history
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jirama_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Données exportées avec succès !', 'success');
}

// Fonction d'importation des données
function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput) return;
    
    fileInput.click();
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.persons !== undefined && importedData.appliances !== undefined) {
                    persons = importedData.persons || [];
                    appliances = importedData.appliances || [];
                    
                    if (importedData.settings) {
                        elecTarifMethod = importedData.settings.elecTarifMethod || 'simple';
                        pricePerKwhSimple = importedData.settings.pricePerKwhSimple || 550;
                        electricityTranches = importedData.settings.electricityTranches || [
                            { min: 0, max: 50, price: 450 },
                            { min: 51, max: 150, price: 550 },
                            { min: 151, max: 300, price: 650 },
                            { min: 301, max: Infinity, price: 750 }
                        ];
                        extraTranches = importedData.settings.extraTranches || [];
                        pricePerM3 = importedData.settings.pricePerM3 || 2500;
                        elecBillAmount = importedData.settings.elecBillAmount || 0;
                        waterBillAmount = importedData.settings.waterBillAmount || 0;
                        elecMethod = importedData.settings.elecMethod || 'basedOnAppliances';
                        waterMethod = importedData.settings.waterMethod || 'equitable';
                    }
                    
                    if (importedData.history) history = importedData.history || [];
                    
                    saveData();
                    updatePersonsList();
                    updateAppliancesList();
                    updateDashboard();
                    updateBilling();
                    updateHistory();
                    loadSettings();
                    initTarifSections();
                    
                    showNotification('Import réussi ! Toutes les données ont été restaurées.', 'success');
                } else {
                    showNotification('Fichier invalide : structure non reconnue', 'error');
                }
            } catch (error) {
                showNotification('Erreur lors de l\'import : fichier JSON invalide', 'error');
                console.error(error);
            }
            
            fileInput.value = '';
        };
        
        reader.readAsText(file);
    };
}

// Sauvegarde et chargement des données
function saveData() {
    const data = {
        persons,
        appliances,
        elecTarifMethod,
        pricePerKwhSimple,
        electricityTranches,
        extraTranches,
        pricePerM3,
        elecBillAmount,
        waterBillAmount,
        elecConsumption,
        waterConsumption,
        elecMethod,
        waterMethod,
        history
    };
    localStorage.setItem('jiramaChargeManager', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('jiramaChargeManager');
    if (savedData) {
        const data = JSON.parse(savedData);
        persons = data.persons || [];
        appliances = data.appliances || [];
        elecTarifMethod = data.elecTarifMethod || 'simple';
        pricePerKwhSimple = data.pricePerKwhSimple || 550;
        electricityTranches = data.electricityTranches || [
            { min: 0, max: 50, price: 450 },
            { min: 51, max: 150, price: 550 },
            { min: 151, max: 300, price: 650 },
            { min: 301, max: Infinity, price: 750 }
        ];
        extraTranches = data.extraTranches || [];
        pricePerM3 = data.pricePerM3 || 2500;
        elecBillAmount = data.elecBillAmount || 0;
        waterBillAmount = data.waterBillAmount || 0;
        elecConsumption = data.elecConsumption || 0;
        waterConsumption = data.waterConsumption || 0;
        elecMethod = data.elecMethod || 'basedOnAppliances';
        waterMethod = data.waterMethod || 'equitable';
        history = data.history || [];
    } else {
        persons = [
            { id: 1, name: 'Rakoto Jean', email: 'rakoto@email.com', phone: '032XXXXXXX', coefficient: 1 },
            { id: 2, name: 'Raso Marie', email: 'marie@email.com', phone: '033XXXXXXX', coefficient: 0.8 }
        ];
        appliances = [];
        waterConsumption = 12;
    }
    loadSettings();
}

// Envoi de message rapide depuis le support
function sendQuickMessage(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const message = form.querySelector('textarea').value;
    
    if (name && email && message) {
        showNotification(`Merci ${name} ! Votre message a été envoyé. Nous vous répondrons sous 24h.`, 'success');
        form.reset();
    } else {
        showNotification('Veuillez remplir tous les champs', 'error');
    }
}

// Fonctions pour les liens du footer
function showGuide() {
    const modal = document.getElementById('guideModal');
    if (modal) modal.style.display = 'block';
}

function closeGuideModal() {
    const modal = document.getElementById('guideModal');
    if (modal) modal.style.display = 'none';
}

function showSupport() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'block';
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'none';
}

function showFAQ() {
    const modal = document.getElementById('faqModal');
    if (modal) modal.style.display = 'block';
}

function closeFAQModal() {
    const modal = document.getElementById('faqModal');
    if (modal) modal.style.display = 'none';
}

function showTarifs() {
    const modal = document.getElementById('tarifsModal');
    if (modal) modal.style.display = 'block';
}

function closeTarifsModal() {
    const modal = document.getElementById('tarifsModal');
    if (modal) modal.style.display = 'none';
}

function showLegal() {
    showNotification('📜 Mentions légales : Application développée pour la gestion des charges JIRAMA.', 'info');
}

function showPrivacy() {
    showNotification('🔒 Politique de confidentialité : Vos données sont stockées localement sur votre appareil.', 'info');
}

function showTerms() {
    showNotification('📋 Conditions Générales d\'Utilisation : Application gratuite pour usage personnel.', 'info');
}

// Gestion du responsive pour les graphiques
function handleResponsiveCharts() {
    window.addEventListener('resize', () => {
        if (elecChart) elecChart.resize();
        if (appliancesChart) appliancesChart.resize();
        if (budgetChart) budgetChart.resize();
    });
}

// Utilitaires
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const personModal = document.getElementById('personModal');
    const applianceModal = document.getElementById('applianceModal');
    const budgetModal = document.getElementById('budgetModal');
    const guideModal = document.getElementById('guideModal');
    const supportModal = document.getElementById('supportModal');
    const tarifsModal = document.getElementById('tarifsModal');
    const faqModal = document.getElementById('faqModal');
    
    if (event.target === personModal) closePersonModal();
    if (event.target === applianceModal) closeApplianceModal();
    if (event.target === budgetModal) closeBudgetModal();
    if (event.target === guideModal) closeGuideModal();
    if (event.target === supportModal) closeSupportModal();
    if (event.target === tarifsModal) closeTarifsModal();
    if (event.target === faqModal) closeFAQModal();
}