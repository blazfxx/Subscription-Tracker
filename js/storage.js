const Storage = {
    KEYS: {
        SUBSCRIPTIONS: 'subtracker_subscriptions',
        EMAIL_ACCOUNTS: 'subtracker_emails',
        SETTINGS: 'subtracker_settings',
        LAST_USED: 'subtracker_last_used',
        API_CREDENTIALS: 'subtracker_api_creds'
    },

    defaultSettings: {
        theme: 'dark',
        accentColor: 'cyan',
        renewalReminders: true,
        reminderDays: 3,
        zombieAlerts: true,
        zombieThresholdDays: 30
    },

    getSubscriptions() {
        try {
            const data = localStorage.getItem(this.KEYS.SUBSCRIPTIONS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveSubscriptions(subscriptions) {
        try {
            localStorage.setItem(this.KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
            return true;
        } catch (e) {
            return false;
        }
    },

    addSubscription(subscription) {
        const subscriptions = this.getSubscriptions();
        const newSub = {
            id: this.generateId(),
            ...subscription,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        subscriptions.push(newSub);
        this.saveSubscriptions(subscriptions);
        return newSub;
    },

    updateSubscription(id, updates) {
        const subscriptions = this.getSubscriptions();
        const index = subscriptions.findIndex(s => s.id === id);
        if (index !== -1) {
            subscriptions[index] = { ...subscriptions[index], ...updates };
            this.saveSubscriptions(subscriptions);
            return subscriptions[index];
        }
        return null;
    },

    deleteSubscription(id) {
        const subscriptions = this.getSubscriptions();
        const filtered = subscriptions.filter(s => s.id !== id);
        this.saveSubscriptions(filtered);
        return filtered.length < subscriptions.length;
    },

    markAsUsed(id) {
        return this.updateSubscription(id, { lastUsed: new Date().toISOString() });
    },

    getEmailAccounts() {
        try {
            const data = localStorage.getItem(this.KEYS.EMAIL_ACCOUNTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveEmailAccounts(accounts) {
        try {
            localStorage.setItem(this.KEYS.EMAIL_ACCOUNTS, JSON.stringify(accounts));
            return true;
        } catch (e) {
            return false;
        }
    },

    addEmailAccount(account) {
        const accounts = this.getEmailAccounts();
        const newAccount = {
            id: this.generateId(),
            ...account,
            connectedAt: new Date().toISOString(),
            lastSynced: null,
            status: 'connected'
        };
        accounts.push(newAccount);
        this.saveEmailAccounts(accounts);
        return newAccount;
    },

    removeEmailAccount(id) {
        const accounts = this.getEmailAccounts();
        const filtered = accounts.filter(a => a.id !== id);
        this.saveEmailAccounts(filtered);
        return filtered.length < accounts.length;
    },

    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? { ...this.defaultSettings, ...JSON.parse(data) } : this.defaultSettings;
        } catch (e) {
            return this.defaultSettings;
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            return false;
        }
    },

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    },

    exportData() {
        return {
            subscriptions: this.getSubscriptions(),
            emailAccounts: this.getEmailAccounts(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    importData(data) {
        try {
            if (data.subscriptions) {
                this.saveSubscriptions(data.subscriptions);
            }
            if (data.emailAccounts) {
                this.saveEmailAccounts(data.emailAccounts);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            return true;
        } catch (e) {
            return false;
        }
    },

    clearAllData() {
        try {
            localStorage.removeItem(this.KEYS.SUBSCRIPTIONS);
            localStorage.removeItem(this.KEYS.EMAIL_ACCOUNTS);
            localStorage.removeItem(this.KEYS.SETTINGS);
            localStorage.removeItem(this.KEYS.LAST_USED);
            localStorage.removeItem(this.KEYS.API_CREDENTIALS);
            return true;
        } catch (e) {
            return false;
        }
    },

    getApiCredentials() {
        try {
            const data = localStorage.getItem(this.KEYS.API_CREDENTIALS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    saveApiCredentials(credentials) {
        try {
            localStorage.setItem(this.KEYS.API_CREDENTIALS, JSON.stringify(credentials));
            return true;
        } catch (e) {
            return false;
        }
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
