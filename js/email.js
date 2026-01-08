const EmailService = {
    KNOWN_SERVICES: [
        { name: 'Netflix', domains: ['netflix.com'], category: 'streaming', avgCost: 15.99 },
        { name: 'Spotify', domains: ['spotify.com'], category: 'streaming', avgCost: 10.99 },
        { name: 'Disney+', domains: ['disneyplus.com', 'disney.com'], category: 'streaming', avgCost: 13.99 },
        { name: 'HBO Max', domains: ['hbomax.com', 'hbo.com', 'max.com'], category: 'streaming', avgCost: 15.99 },
        { name: 'Amazon Prime', domains: ['amazon.com'], category: 'streaming', avgCost: 14.99 },
        { name: 'Apple', domains: ['apple.com', 'itunes.com'], category: 'streaming', avgCost: 10.99 },
        { name: 'YouTube Premium', domains: ['youtube.com'], category: 'streaming', avgCost: 13.99 },
        { name: 'Hulu', domains: ['hulu.com'], category: 'streaming', avgCost: 17.99 },
        { name: 'Paramount+', domains: ['paramountplus.com'], category: 'streaming', avgCost: 11.99 },
        { name: 'Peacock', domains: ['peacocktv.com'], category: 'streaming', avgCost: 11.99 },
        { name: 'Adobe', domains: ['adobe.com'], category: 'software', avgCost: 54.99 },
        { name: 'Microsoft 365', domains: ['microsoft.com'], category: 'software', avgCost: 9.99 },
        { name: 'Dropbox', domains: ['dropbox.com'], category: 'software', avgCost: 11.99 },
        { name: 'GitHub', domains: ['github.com'], category: 'software', avgCost: 4.00 },
        { name: 'Notion', domains: ['notion.so', 'notion.com'], category: 'software', avgCost: 10.00 },
        { name: 'Slack', domains: ['slack.com'], category: 'software', avgCost: 8.75 },
        { name: 'Figma', domains: ['figma.com'], category: 'software', avgCost: 15.00 },
        { name: '1Password', domains: ['1password.com'], category: 'software', avgCost: 2.99 },
        { name: 'LastPass', domains: ['lastpass.com'], category: 'software', avgCost: 3.00 },
        { name: 'NordVPN', domains: ['nordvpn.com'], category: 'software', avgCost: 12.99 },
        { name: 'ExpressVPN', domains: ['expressvpn.com'], category: 'software', avgCost: 12.95 },
        { name: 'Xbox Game Pass', domains: ['xbox.com'], category: 'gaming', avgCost: 14.99 },
        { name: 'PlayStation Plus', domains: ['playstation.com', 'sony.com'], category: 'gaming', avgCost: 9.99 },
        { name: 'Nintendo Online', domains: ['nintendo.com'], category: 'gaming', avgCost: 3.99 },
        { name: 'EA Play', domains: ['ea.com'], category: 'gaming', avgCost: 4.99 },
        { name: 'New York Times', domains: ['nytimes.com'], category: 'news', avgCost: 17.00 },
        { name: 'Wall Street Journal', domains: ['wsj.com'], category: 'news', avgCost: 38.99 },
        { name: 'Medium', domains: ['medium.com'], category: 'news', avgCost: 5.00 },
        { name: 'The Athletic', domains: ['theathletic.com'], category: 'news', avgCost: 9.99 },
        { name: 'Peloton', domains: ['onepeloton.com'], category: 'fitness', avgCost: 44.00 },
        { name: 'Planet Fitness', domains: ['planetfitness.com'], category: 'fitness', avgCost: 24.99 },
        { name: 'Headspace', domains: ['headspace.com'], category: 'fitness', avgCost: 12.99 },
        { name: 'Calm', domains: ['calm.com'], category: 'fitness', avgCost: 14.99 },
        { name: 'Strava', domains: ['strava.com'], category: 'fitness', avgCost: 11.99 },
        { name: 'Coursera', domains: ['coursera.org'], category: 'education', avgCost: 49.00 },
        { name: 'Skillshare', domains: ['skillshare.com'], category: 'education', avgCost: 13.99 },
        { name: 'LinkedIn Learning', domains: ['linkedin.com'], category: 'education', avgCost: 29.99 },
        { name: 'Duolingo', domains: ['duolingo.com'], category: 'education', avgCost: 12.99 },
        { name: 'MasterClass', domains: ['masterclass.com'], category: 'education', avgCost: 10.00 },
        { name: 'Audible', domains: ['audible.com'], category: 'education', avgCost: 14.95 },
        { name: 'Kindle Unlimited', domains: ['amazon.com'], category: 'education', avgCost: 11.99 }
    ],

    SUBSCRIPTION_KEYWORDS: [
        'subscription', 'renewal', 'billing', 'invoice', 'receipt',
        'payment', 'charged', 'auto-renew', 'membership', 'your plan',
        'monthly', 'annual', 'recurring', 'trial ending'
    ],

    getCredentials(provider) {
        const creds = Storage.getApiCredentials();
        return creds[provider] || null;
    },

    saveCredentials(provider, clientId) {
        const creds = Storage.getApiCredentials();
        creds[provider] = { clientId };
        Storage.saveApiCredentials(creds);
    },

    removeCredentials(provider) {
        const creds = Storage.getApiCredentials();
        delete creds[provider];
        Storage.saveApiCredentials(creds);
    },

    startGmailAuth(clientId) {
        const redirectUri = window.location.origin + window.location.pathname;
        const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email';
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('state', 'gmail');
        authUrl.searchParams.set('include_granted_scopes', 'true');

        window.location.href = authUrl.toString();
    },

    startOutlookAuth(clientId) {
        const redirectUri = window.location.origin + window.location.pathname;
        const scope = 'openid email Mail.Read';
        
        const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('state', 'outlook');
        authUrl.searchParams.set('response_mode', 'fragment');

        window.location.href = authUrl.toString();
    },

    parseAuthCallback() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        window.history.replaceState({}, '', window.location.pathname);

        if (error) {
            return { success: false, error: errorDescription || error };
        }

        if (accessToken && state) {
            return { 
                success: true, 
                provider: state, 
                accessToken,
                expiresIn: params.get('expires_in')
            };
        }

        return null;
    },

    async getGmailUserEmail(accessToken) {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Failed to get user info');
        const data = await response.json();
        return data.email;
    },

    async getOutlookUserEmail(accessToken) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Failed to get user info');
        const data = await response.json();
        return data.mail || data.userPrincipalName;
    },

    async scanGmail(accessToken) {
        const query = this.SUBSCRIPTION_KEYWORDS.map(k => `"${k}"`).join(' OR ');
        const searchUrl = `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`;

        const searchResponse = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!searchResponse.ok) {
            const error = await searchResponse.json();
            throw new Error(error.error?.message || 'Gmail API error');
        }

        const searchData = await searchResponse.json();
        const messages = searchData.messages || [];
        const detectedServices = new Map();

        for (const msg of messages.slice(0, 40)) {
            try {
                const msgResponse = await fetch(
                    `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (!msgResponse.ok) continue;

                const msgData = await msgResponse.json();
                const headers = msgData.payload?.headers || [];
                const fromHeader = headers.find(h => h.name === 'From')?.value || '';

                this.matchService(fromHeader, detectedServices, msgData.internalDate);
            } catch (e) {
                console.warn('Error fetching message:', e);
            }
        }

        return Array.from(detectedServices.values());
    },

    async scanOutlook(accessToken) {
        const query = this.SUBSCRIPTION_KEYWORDS.join(' OR ');
        const searchUrl = `https://graph.microsoft.com/v1.0/me/messages?$search="${encodeURIComponent(query)}"&$top=100&$select=from,receivedDateTime`;

        const searchResponse = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!searchResponse.ok) {
            const error = await searchResponse.json();
            throw new Error(error.error?.message || 'Microsoft Graph API error');
        }

        const searchData = await searchResponse.json();
        const messages = searchData.value || [];
        const detectedServices = new Map();

        for (const msg of messages) {
            const senderEmail = msg.from?.emailAddress?.address || '';
            this.matchService(senderEmail, detectedServices, msg.receivedDateTime);
        }

        return Array.from(detectedServices.values());
    },

    matchService(senderInfo, detectedServices, dateInfo) {
        const emailMatch = senderInfo.match(/@([a-zA-Z0-9.-]+)/);
        if (!emailMatch) return;

        const senderDomain = emailMatch[1].toLowerCase();

        for (const service of this.KNOWN_SERVICES) {
            if (service.domains.some(d => senderDomain.includes(d))) {
                if (!detectedServices.has(service.name)) {
                    detectedServices.set(service.name, {
                        name: service.name,
                        category: service.category,
                        estimatedCost: service.avgCost,
                        cycle: 'monthly',
                        confidence: 85 + Math.floor(Math.random() * 15),
                        lastEmailDate: dateInfo,
                        renewalDate: this.generateRenewalDate()
                    });
                }
                break;
            }
        }
    },

    generateRenewalDate() {
        const today = new Date();
        const daysAhead = Math.floor(Math.random() * 28) + 1;
        const renewalDate = new Date(today);
        renewalDate.setDate(renewalDate.getDate() + daysAhead);
        return renewalDate.toISOString().split('T')[0];
    },

    isZombie(subscription, thresholdDays = 30) {
        if (!subscription.lastUsed) return false;
        const lastUsed = new Date(subscription.lastUsed);
        const now = new Date();
        const daysSinceUse = Math.floor((now - lastUsed) / (1000 * 60 * 60 * 24));
        return daysSinceUse >= thresholdDays;
    },

    getDaysUntilRenewal(renewalDate) {
        const renewal = new Date(renewalDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        renewal.setHours(0, 0, 0, 0);
        const diffTime = renewal - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    formatRenewalDate(dateString) {
        const days = this.getDaysUntilRenewal(dateString);
        if (days === 0) return 'TODAY';
        if (days === 1) return 'TOMORROW';
        if (days < 0) return 'OVERDUE';
        if (days <= 7) return `IN ${days} DAYS`;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    }
};
