// Advertisement Management System for eezyGet
// Handles ad placement, lazy loading, and responsive behavior

class AdManager {
    constructor() {
        this.adZones = [];
        this.adProviders = {
            google: {
                name: 'Google AdSense',
                enabled: false,
                clientId: null
            },
            custom: {
                name: 'Custom Ads',
                enabled: true
            }
        };
        this.init();
    }

    init() {
        // Initialize ad zones when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.createAdZones();
            this.initLazyLoading();
        });
    }

    createAdZones() {
        const adConfigs = [
            {
                id: 'top-banner',
                type: 'banner',
                position: 'after-hero',
                size: '728x90',
                mobile: '320x50'
            },
            {
                id: 'sidebar-1',
                type: 'sidebar',
                position: 'content-sidebar',
                size: '300x250',
                mobile: '320x100'
            },
            {
                id: 'sidebar-2',
                type: 'sidebar',
                position: 'content-sidebar',
                size: '300x600',
                mobile: '320x100'
            },
            {
                id: 'inline-content',
                type: 'inline',
                position: 'mid-content',
                size: '468x60',
                mobile: '320x100'
            },
            {
                id: 'bottom-banner',
                type: 'banner',
                position: 'before-footer',
                size: '728x90',
                mobile: '320x50'
            }
        ];

        adConfigs.forEach(config => {
            this.createAdZone(config);
        });
    }

    createAdZone(config) {
        const adZone = document.createElement('div');
        adZone.className = `ad-zone ${config.type}`;
        adZone.id = config.id;
        adZone.dataset.size = config.size;
        adZone.dataset.mobileSize = config.mobile;
        
        // Create placeholder content
        const placeholder = document.createElement('div');
        placeholder.className = 'ad-placeholder';
        placeholder.innerHTML = `
            <i class="fas fa-ad"></i>
            <div>Reklam Alanı</div>
            <div class="ad-size">${config.size}</div>
        `;
        
        adZone.appendChild(placeholder);
        
        // Insert into DOM based on position
        this.insertAdZone(adZone, config.position);
        
        // Add to tracking
        this.adZones.push({
            element: adZone,
            config: config,
            loaded: false
        });
    }

    insertAdZone(adZone, position) {
        const container = document.querySelector('.container');
        const main = document.querySelector('.main');
        
        switch (position) {
            case 'after-hero':
                const heroSection = document.querySelector('.hero-section');
                if (heroSection) {
                    heroSection.after(adZone);
                }
                break;
                
            case 'content-sidebar':
                this.createSidebarLayout(adZone);
                break;
                
            case 'mid-content':
                const howToUse = document.querySelector('.how-to-use');
                if (howToUse) {
                    howToUse.before(adZone);
                }
                break;
                
            case 'before-footer':
                const footer = document.querySelector('.footer');
                if (footer) {
                    footer.before(adZone);
                }
                break;
        }
    }

    createSidebarLayout(adZone) {
        const main = document.querySelector('.main');
        const container = main.querySelector('.container');
        
        // Check if sidebar layout already exists
        let contentWrapper = container.querySelector('.content-with-sidebar');
        
        if (!contentWrapper) {
            // Create sidebar layout
            contentWrapper = document.createElement('div');
            contentWrapper.className = 'content-with-sidebar';
            
            const mainContent = document.createElement('div');
            mainContent.className = 'main-content';
            
            const sidebarAds = document.createElement('div');
            sidebarAds.className = 'sidebar-ads';
            
            // Move existing content to main-content
            while (container.firstChild) {
                mainContent.appendChild(container.firstChild);
            }
            
            contentWrapper.appendChild(mainContent);
            contentWrapper.appendChild(sidebarAds);
            container.appendChild(contentWrapper);
        }
        
        // Add ad to sidebar
        const sidebarAds = container.querySelector('.sidebar-ads');
        if (sidebarAds) {
            sidebarAds.appendChild(adZone);
        }
    }

    initLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const adZone = this.adZones.find(ad => ad.element === entry.target);
                    if (adZone && !adZone.loaded) {
                        this.loadAd(adZone);
                    }
                }
            });
        }, {
            rootMargin: '100px'
        });

        this.adZones.forEach(adZone => {
            observer.observe(adZone.element);
        });
    }

    loadAd(adZone) {
        // Simulate ad loading
        setTimeout(() => {
            this.displayAd(adZone);
            adZone.loaded = true;
        }, 1000);
    }

    displayAd(adZone) {
        const { element, config } = adZone;
        const isMobile = window.innerWidth <= 768;
        const size = isMobile ? config.config.mobile : config.config.size;
        
        // For demo purposes, create a sample ad
        const adContent = this.createSampleAd(config.config, size);
        element.innerHTML = adContent;
        element.classList.add('ad-loaded');
    }

    createSampleAd(config, size) {
        const [width, height] = size.split('x');
        
        // Sample ad content for demo
        return `
            <div style="
                width: 100%; 
                height: ${height}px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: 'Inter', sans-serif;
            ">
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">
                    🎵 Premium Müzik Deneyimi
                </div>
                <div style="font-size: 0.9rem; text-align: center; opacity: 0.9; margin-bottom: 1rem;">
                    Sınırsız indirme, yüksek kalite, reklamsız deneyim
                </div>
                <div style="
                    background: rgba(255,255,255,0.2);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    Daha Fazla Bilgi
                </div>
            </div>
        `;
    }

    // Public methods for external control
    hideAds() {
        this.adZones.forEach(adZone => {
            adZone.element.style.display = 'none';
        });
    }

    showAds() {
        this.adZones.forEach(adZone => {
            adZone.element.style.display = 'flex';
        });
    }

    removeAds() {
        this.adZones.forEach(adZone => {
            adZone.element.remove();
        });
        this.adZones = [];
    }

    // Method to integrate with ad networks
    initGoogleAdsense(clientId) {
        this.adProviders.google.enabled = true;
        this.adProviders.google.clientId = clientId;
        
        // Load Google AdSense script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }

    // Analytics integration
    trackAdView(adId) {
        // Track ad impressions
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ad_impression', {
                ad_id: adId,
                event_category: 'advertising'
            });
        }
    }

    trackAdClick(adId) {
        // Track ad clicks
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ad_click', {
                ad_id: adId,
                event_category: 'advertising'
            });
        }
    }
}

// Initialize ad manager
const adManager = new AdManager();

// Export for external use
window.adManager = adManager;

// Add CSS for loaded ads
const adStyles = document.createElement('style');
adStyles.textContent = `
    .ad-zone.ad-loaded {
        border: 2px solid rgba(29, 185, 84, 0.2);
        background: white;
    }
    
    .ad-zone.ad-loaded:hover {
        border-color: rgba(29, 185, 84, 0.4);
    }
`;
document.head.appendChild(adStyles);