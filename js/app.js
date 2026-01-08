const App = {
    currentView: 'dashboard',
    editingSubscriptionId: null,

    init() {
        this.loadSettings();
        this.bindEvents();
        this.updateHelpUrls();
        this.loadApiCredentials();
        
        const authResult = EmailService.parseAuthCallback();
        if (authResult) {
            this.handleAuthCallback(authResult);
        }
        
        this.renderDashboard();
        this.renderSubscriptions();
        this.renderEmailAccounts();
    },

    async handleAuthCallback(result) {
        if (!result.success) {
            this.showToast(`AUTH ERROR: ${result.error}`, 'error');
            return;
        }

        this.showToast('AUTHENTICATING...', 'warning');
        this.switchView('email');

        try {
            let email;
            if (result.provider === 'gmail') {
                email = await EmailService.getGmailUserEmail(result.accessToken);
            } else {
                email = await EmailService.getOutlookUserEmail(result.accessToken);
            }

            const account = Storage.addEmailAccount({
                email,
                provider: result.provider,
                accessToken: result.accessToken,
                expiresAt: Date.now() + (parseInt(result.expiresIn) * 1000)
            });

            this.showToast(`CONNECTED: ${email}`, 'success');
            this.renderEmailAccounts();
            setTimeout(() => this.scanEmail(account.id), 500);
        } catch (err) {
            this.showToast('FAILED TO GET USER INFO', 'error');
        }
    },

    updateHelpUrls() {
        const origin = window.location.origin;
        const path = window.location.pathname;
        const fullUrl = origin + path;

        const jsOrigin = document.getElementById('jsOrigin');
        const redirectUri = document.getElementById('redirectUri');
        const msRedirectUri = document.getElementById('msRedirectUri');

        if (jsOrigin) jsOrigin.textContent = origin;
        if (redirectUri) redirectUri.textContent = fullUrl;
        if (msRedirectUri) msRedirectUri.textContent = fullUrl;
    },

    loadApiCredentials() {
        const creds = Storage.getApiCredentials();

        const gmailStatus = document.getElementById('gmailStatus');
        const gmailInput = document.getElementById('gmailClientId');
        if (creds.gmail?.clientId) {
            gmailInput.value = creds.gmail.clientId;
            gmailStatus.textContent = 'CONFIGURED';
            gmailStatus.classList.add('connected');
        }

        const outlookStatus = document.getElementById('outlookStatus');
        const outlookInput = document.getElementById('outlookClientId');
        if (creds.outlook?.clientId) {
            outlookInput.value = creds.outlook.clientId;
            outlookStatus.textContent = 'CONFIGURED';
            outlookStatus.classList.add('connected');
        }
    },

    loadSettings() {
        const settings = Storage.getSettings();
        
        document.body.dataset.theme = settings.theme;
        document.getElementById('themeSelect').value = settings.theme;
        
        document.body.dataset.accent = settings.accentColor;
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === settings.accentColor);
        });
        
        document.getElementById('renewalReminders').checked = settings.renewalReminders;
        document.getElementById('reminderDays').value = settings.reminderDays;
        document.getElementById('zombieAlerts').checked = settings.zombieAlerts;
    },

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setAccentColor(e.target.dataset.color));
        });

        document.getElementById('addSubBtn').addEventListener('click', () => this.openSubModal());

        document.getElementById('closeModal').addEventListener('click', () => this.closeSubModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeSubModal());
        document.getElementById('subForm').addEventListener('submit', (e) => this.handleSubFormSubmit(e));

        document.getElementById('saveGmailBtn').addEventListener('click', () => this.saveAndConnectGmail());
        document.getElementById('saveOutlookBtn').addEventListener('click', () => this.saveAndConnectOutlook());
        document.getElementById('helpGmailBtn').addEventListener('click', () => {
            document.getElementById('helpGmailModal').classList.add('active');
        });
        document.getElementById('helpOutlookBtn').addEventListener('click', () => {
            document.getElementById('helpOutlookModal').classList.add('active');
        });

        document.getElementById('renewalReminders').addEventListener('change', (e) => {
            Storage.updateSetting('renewalReminders', e.target.checked);
        });
        document.getElementById('reminderDays').addEventListener('change', (e) => {
            Storage.updateSetting('reminderDays', parseInt(e.target.value));
        });
        document.getElementById('zombieAlerts').addEventListener('change', (e) => {
            Storage.updateSetting('zombieAlerts', e.target.checked);
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.importData());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearData());

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            }
        });
    },

    saveAndConnectGmail() {
        const clientId = document.getElementById('gmailClientId').value.trim();
        if (!clientId) {
            this.showToast('ENTER YOUR GOOGLE CLIENT ID', 'error');
            return;
        }

        if (!clientId.includes('.apps.googleusercontent.com')) {
            this.showToast('INVALID CLIENT ID FORMAT', 'error');
            return;
        }

        EmailService.saveCredentials('gmail', clientId);
        
        const gmailStatus = document.getElementById('gmailStatus');
        gmailStatus.textContent = 'CONFIGURED';
        gmailStatus.classList.add('connected');

        this.showToast('REDIRECTING TO GOOGLE...', 'warning');
        setTimeout(() => EmailService.startGmailAuth(clientId), 500);
    },

    saveAndConnectOutlook() {
        const clientId = document.getElementById('outlookClientId').value.trim();
        if (!clientId) {
            this.showToast('ENTER YOUR MICROSOFT APPLICATION ID', 'error');
            return;
        }

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
            this.showToast('INVALID APPLICATION ID FORMAT', 'error');
            return;
        }

        EmailService.saveCredentials('outlook', clientId);
        
        const outlookStatus = document.getElementById('outlookStatus');
        outlookStatus.textContent = 'CONFIGURED';
        outlookStatus.classList.add('connected');

        this.showToast('REDIRECTING TO MICROSOFT...', 'warning');
        setTimeout(() => EmailService.startOutlookAuth(clientId), 500);
    },

    switchView(viewName) {
        this.currentView = viewName;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        if (viewName === 'dashboard') this.renderDashboard();
        if (viewName === 'subscriptions') this.renderSubscriptions();
        if (viewName === 'email') this.renderEmailAccounts();
    },

    toggleTheme() {
        const currentTheme = document.body.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    setTheme(theme) {
        document.body.dataset.theme = theme;
        document.getElementById('themeSelect').value = theme;
        Storage.updateSetting('theme', theme);
    },

    setAccentColor(color) {
        document.body.dataset.accent = color;
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        Storage.updateSetting('accentColor', color);
    },

    renderDashboard() {
        const subscriptions = Storage.getSubscriptions();
        const settings = Storage.getSettings();
        
        const activeSubs = subscriptions.length;
        const monthlyCost = this.calculateMonthlyCost(subscriptions);
        const yearlyCost = monthlyCost * 12;
        const zombies = subscriptions.filter(s => EmailService.isZombie(s, settings.zombieThresholdDays));
        
        document.getElementById('activeSubs').textContent = activeSubs;
        document.getElementById('monthlyCost').textContent = `$${monthlyCost.toFixed(2)}`;
        document.getElementById('yearlyCost').textContent = `$${yearlyCost.toFixed(2)}`;
        document.getElementById('zombieCount').textContent = zombies.length;
        
        this.renderRenewals(subscriptions, settings.reminderDays);
        this.renderZombies(zombies);
    },

    calculateMonthlyCost(subscriptions) {
        return subscriptions.reduce((total, sub) => {
            const cost = parseFloat(sub.cost) || 0;
            switch (sub.cycle) {
                case 'weekly': return total + (cost * 4.33);
                case 'yearly': return total + (cost / 12);
                default: return total + cost;
            }
        }, 0);
    },

    renderRenewals(subscriptions, reminderDays) {
        const container = document.getElementById('renewalsList');
        
        const upcoming = subscriptions
            .filter(s => {
                const days = EmailService.getDaysUntilRenewal(s.renewalDate);
                return days >= 0 && days <= 30;
            })
            .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
        
        if (upcoming.length === 0) {
            container.innerHTML = '<p class="empty-state">NO UPCOMING RENEWALS IN THE NEXT 30 DAYS</p>';
            return;
        }
        
        container.innerHTML = upcoming.map(sub => {
            const days = EmailService.getDaysUntilRenewal(sub.renewalDate);
            const isUrgent = days <= reminderDays;
            return `
                <div class="renewal-item ${isUrgent ? 'urgent' : ''}">
                    <div class="renewal-info">
                        <span class="subscription-name">${this.escapeHtml(sub.name)}</span>
                        <span class="subscription-meta">$${parseFloat(sub.cost).toFixed(2)} / ${sub.cycle}</span>
                    </div>
                    <span class="renewal-date">${EmailService.formatRenewalDate(sub.renewalDate)}</span>
                </div>
            `;
        }).join('');
    },

    renderZombies(zombies) {
        const container = document.getElementById('zombiesList');
        
        if (zombies.length === 0) {
            container.innerHTML = '<p class="empty-state">NO ZOMBIE SUBSCRIPTIONS FOUND - YOU\'RE USING EVERYTHING!</p>';
            return;
        }
        
        container.innerHTML = zombies.map(sub => {
            const lastUsed = new Date(sub.lastUsed);
            const daysSince = Math.floor((new Date() - lastUsed) / (1000 * 60 * 60 * 24));
            return `
                <div class="zombie-item">
                    <div class="zombie-info">
                        <span class="zombie-name">${this.escapeHtml(sub.name)}</span>
                        <span class="zombie-meta">NOT USED IN ${daysSince} DAYS - $${parseFloat(sub.cost).toFixed(2)}/${sub.cycle}</span>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="App.markAsUsed('${sub.id}')">MARK USED</button>
                        <button class="btn btn-danger" onclick="App.deleteSubscription('${sub.id}')">CANCEL</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSubscriptions() {
        const container = document.getElementById('subscriptionsList');
        const subscriptions = Storage.getSubscriptions();
        
        if (subscriptions.length === 0) {
            container.innerHTML = '<p class="empty-state">NO SUBSCRIPTIONS YET. ADD ONE TO GET STARTED!</p>';
            return;
        }
        
        container.innerHTML = subscriptions.map(sub => `
            <div class="subscription-item">
                <div class="subscription-info">
                    <span class="subscription-name">${this.escapeHtml(sub.name)}</span>
                    <span class="subscription-meta">${sub.category.toUpperCase()} • RENEWS ${EmailService.formatRenewalDate(sub.renewalDate)}</span>
                </div>
                <span class="subscription-cost">$${parseFloat(sub.cost).toFixed(2)}/${sub.cycle.charAt(0).toUpperCase()}</span>
                <div class="subscription-actions">
                    <button class="btn btn-secondary" onclick="App.editSubscription('${sub.id}')" aria-label="Edit ${this.escapeHtml(sub.name)}">EDIT</button>
                    <button class="btn btn-danger" onclick="App.deleteSubscription('${sub.id}')" aria-label="Delete ${this.escapeHtml(sub.name)}">DELETE</button>
                </div>
            </div>
        `).join('');
    },

    openSubModal(subscription = null) {
        const modal = document.getElementById('subModal');
        const form = document.getElementById('subForm');
        const title = document.getElementById('modalTitle');
        
        form.reset();
        
        if (subscription) {
            this.editingSubscriptionId = subscription.id;
            title.textContent = 'EDIT SUBSCRIPTION';
            document.getElementById('subName').value = subscription.name;
            document.getElementById('subCost').value = subscription.cost;
            document.getElementById('subCycle').value = subscription.cycle;
            document.getElementById('subRenewal').value = subscription.renewalDate;
            document.getElementById('subCategory').value = subscription.category;
            document.getElementById('subNotes').value = subscription.notes || '';
        } else {
            this.editingSubscriptionId = null;
            title.textContent = 'ADD SUBSCRIPTION';
            document.getElementById('subRenewal').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
        document.getElementById('subName').focus();
    },

    closeSubModal() {
        document.getElementById('subModal').classList.remove('active');
        this.editingSubscriptionId = null;
    },

    handleSubFormSubmit(e) {
        e.preventDefault();
        
        const subscriptionData = {
            name: document.getElementById('subName').value.trim(),
            cost: parseFloat(document.getElementById('subCost').value),
            cycle: document.getElementById('subCycle').value,
            renewalDate: document.getElementById('subRenewal').value,
            category: document.getElementById('subCategory').value,
            notes: document.getElementById('subNotes').value.trim()
        };
        
        if (this.editingSubscriptionId) {
            Storage.updateSubscription(this.editingSubscriptionId, subscriptionData);
            this.showToast('SUBSCRIPTION UPDATED', 'success');
        } else {
            Storage.addSubscription(subscriptionData);
            this.showToast('SUBSCRIPTION ADDED', 'success');
        }
        
        this.closeSubModal();
        this.renderDashboard();
        this.renderSubscriptions();
    },

    editSubscription(id) {
        const subscriptions = Storage.getSubscriptions();
        const subscription = subscriptions.find(s => s.id === id);
        if (subscription) {
            this.openSubModal(subscription);
        }
    },

    deleteSubscription(id) {
        if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS SUBSCRIPTION?')) {
            Storage.deleteSubscription(id);
            this.showToast('SUBSCRIPTION DELETED', 'success');
            this.renderDashboard();
            this.renderSubscriptions();
        }
    },

    markAsUsed(id) {
        Storage.markAsUsed(id);
        this.showToast('MARKED AS USED', 'success');
        this.renderDashboard();
    },

    renderEmailAccounts() {
        const container = document.getElementById('emailAccounts');
        const accounts = Storage.getEmailAccounts();
        
        if (accounts.length === 0) {
            container.innerHTML = '<p class="empty-state">NO EMAIL ACCOUNTS CONNECTED</p>';
            return;
        }
        
        container.innerHTML = accounts.map(account => {
            const isExpired = account.expiresAt && Date.now() > account.expiresAt;
            return `
                <div class="email-account-item">
                    <div class="email-status">
                        <span class="status-dot ${isExpired ? 'error' : ''}"></span>
                        <span>${this.escapeHtml(account.email)}</span>
                        <span class="subscription-meta">${account.provider.toUpperCase()}${isExpired ? ' • EXPIRED' : ''}</span>
                    </div>
                    <div class="btn-group">
                        ${isExpired ? `<button class="btn btn-primary" onclick="App.reconnectEmail('${account.provider}')">RECONNECT</button>` : 
                        `<button class="btn btn-secondary" onclick="App.scanEmail('${account.id}')">SCAN</button>`}
                        <button class="btn btn-danger" onclick="App.removeEmail('${account.id}')">REMOVE</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    reconnectEmail(provider) {
        const creds = Storage.getApiCredentials();
        if (provider === 'gmail' && creds.gmail?.clientId) {
            EmailService.startGmailAuth(creds.gmail.clientId);
        } else if (provider === 'outlook' && creds.outlook?.clientId) {
            EmailService.startOutlookAuth(creds.outlook.clientId);
        } else {
            this.showToast('API CREDENTIALS NOT FOUND', 'error');
        }
    },

    async scanEmail(accountId) {
        const accounts = Storage.getEmailAccounts();
        const account = accounts.find(a => a.id === accountId);
        
        if (!account) return;

        if (account.expiresAt && Date.now() > account.expiresAt) {
            this.showToast('TOKEN EXPIRED - PLEASE RECONNECT', 'error');
            return;
        }
        
        const detectedList = document.getElementById('detectedList');
        detectedList.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">SCANNING EMAILS...</div>';
        
        try {
            let subscriptions;
            if (account.provider === 'gmail') {
                subscriptions = await EmailService.scanGmail(account.accessToken);
            } else {
                subscriptions = await EmailService.scanOutlook(account.accessToken);
            }
            
            if (subscriptions.length === 0) {
                detectedList.innerHTML = '<p class="empty-state">NO NEW SUBSCRIPTIONS DETECTED</p>';
                this.showToast('SCAN COMPLETE - NO NEW SUBS FOUND', 'success');
                return;
            }
            
            detectedList.innerHTML = subscriptions.map(sub => `
                <div class="subscription-item">
                    <div class="subscription-info">
                        <span class="subscription-name">${this.escapeHtml(sub.name)}</span>
                        <span class="subscription-meta">${sub.category.toUpperCase()} • ${sub.confidence}% CONFIDENCE</span>
                    </div>
                    <span class="subscription-cost">~$${sub.estimatedCost.toFixed(2)}/M</span>
                    <button class="btn btn-primary" onclick="App.addDetectedSubscription('${this.escapeHtml(sub.name)}', ${sub.estimatedCost}, '${sub.category}', '${sub.renewalDate}')">ADD</button>
                </div>
            `).join('');
            
            this.showToast(`FOUND ${subscriptions.length} SUBSCRIPTIONS`, 'success');
        } catch (error) {
            detectedList.innerHTML = `<p class="empty-state">ERROR: ${this.escapeHtml(error.message)}</p>`;
            this.showToast('SCAN FAILED', 'error');
        }
    },

    addDetectedSubscription(name, cost, category, renewalDate) {
        Storage.addSubscription({
            name: name,
            cost: cost,
            cycle: 'monthly',
            renewalDate: renewalDate,
            category: category,
            notes: 'Auto-detected from email'
        });
        this.showToast(`${name} ADDED`, 'success');
        this.renderDashboard();
        this.renderSubscriptions();
    },

    removeEmail(id) {
        if (confirm('REMOVE THIS EMAIL ACCOUNT?')) {
            Storage.removeEmailAccount(id);
            this.showToast('EMAIL REMOVED', 'success');
            this.renderEmailAccounts();
        }
    },

    exportData() {
        const data = Storage.exportData();
        delete data.apiCredentials;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subtracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('DATA EXPORTED', 'success');
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Storage.importData(data)) {
                        this.loadSettings();
                        this.renderDashboard();
                        this.renderSubscriptions();
                        this.renderEmailAccounts();
                        this.showToast('DATA IMPORTED', 'success');
                    }
                } catch (error) {
                    this.showToast('INVALID FILE FORMAT', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    clearData() {
        if (confirm('THIS WILL DELETE ALL YOUR DATA INCLUDING API CREDENTIALS. ARE YOU SURE?')) {
            Storage.clearAllData();
            this.loadSettings();
            this.loadApiCredentials();
            this.renderDashboard();
            this.renderSubscriptions();
            this.renderEmailAccounts();
            
            document.getElementById('gmailStatus').textContent = 'NOT CONFIGURED';
            document.getElementById('gmailStatus').classList.remove('connected');
            document.getElementById('gmailClientId').value = '';
            document.getElementById('outlookStatus').textContent = 'NOT CONFIGURED';
            document.getElementById('outlookStatus').classList.remove('connected');
            document.getElementById('outlookClientId').value = '';
            
            this.showToast('ALL DATA CLEARED', 'success');
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
