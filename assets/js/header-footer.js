// Unified Header/Footer System for eezyGet
// This system dynamically loads header and footer content for all pages

// Header HTML template
const headerHTML = `
<div class="container">
    <a href="index.html" class="logo">
        <img src="logo-01.svg" alt="eezyGet" class="logo-svg">
    </a>
    
    <div class="header-right">
        <div class="language-selector">
            <select class="lang-select" id="language-select">
                <option value="tr" selected>🇹🇷 Türkçe</option>
                <option value="en">🇺🇸 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="es">🇪🇸 Español</option>
                <option value="it">🇮🇹 Italiano</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="he">🇮🇱 עברית</option>
                <option value="el">🇬🇷 Ελληνικά</option>
                <option value="hi">🇮🇳 हिन्दी</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="zh">🇨🇳 中文</option>
            </select>
        </div>
        
        <button class="mobile-menu-toggle" id="mobile-menu-toggle">
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </button>
    </div>
    
    <nav class="navigation" id="navigation">
        <a href="index.html" class="nav-link" data-nav="home">
            <i class="fas fa-home"></i>
            Ana Sayfa
        </a>
        <a href="spotify.html" class="nav-link">
            <i class="fab fa-spotify"></i>
            Spotify
        </a>
        <a href="youtube.html" class="nav-link">
            <i class="fab fa-youtube"></i>
            YouTube
        </a>
        <a href="instagram.html" class="nav-link">
            <i class="fab fa-instagram"></i>
            Instagram
        </a>
        <a href="tiktok.html" class="nav-link">
            <i class="fab fa-tiktok"></i>
            TikTok
        </a>
        <a href="soundcloud.html" class="nav-link">
            <i class="fab fa-soundcloud"></i>
            SoundCloud
        </a>
        <a href="facebook.html" class="nav-link">
            <i class="fab fa-facebook"></i>
            Facebook
        </a>
        <a href="vimeo.html" class="nav-link">
            <i class="fab fa-vimeo"></i>
            Vimeo
        </a>
    </nav>
    
    <div class="mobile-overlay" id="mobile-overlay"></div>
</div>
`;

// Footer HTML template
const footerHTML = `
<div class="container">
    <div class="footer-content">
        <div class="footer-section">
            <div class="footer-logo">
                <img src="logo-01.svg" alt="eezyGet" class="footer-logo-svg">
            </div>
            <p class="footer-description">
                Çoklu platform müzik ve video indirici. Spotify, YouTube ve daha fazlası için ücretsiz hizmet.
            </p>
        </div>
        <div class="footer-section">
            <h4>Platformlar</h4>
            <ul>
                <li><a href="spotify.html">Spotify</a></li>
                <li><a href="youtube.html">YouTube</a></li>
                <li><a href="instagram.html">Instagram</a></li>
                <li><a href="tiktok.html">TikTok</a></li>
                <li><a href="soundcloud.html">SoundCloud</a></li>
                <li><a href="facebook.html">Facebook</a></li>
                <li><a href="vimeo.html">Vimeo</a></li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Hakkında</h4>
            <ul>
                <li><a href="#privacy">Gizlilik Politikası</a></li>
                <li><a href="#terms">Kullanım Şartları</a></li>
                <li><a href="#contact">İletişim</a></li>
                <li><a href="#faq">SSS</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom">
        <p>© <span id="current-year">2025</span> eezyGet. Tüm hakları saklıdır.</p>
        <p class="disclaimer">Bu site yalnızca eğitim amaçlıdır. Telif hakkı yasalarına uygun hareket edin.</p>
        <div class="footer-center-logo">
            <img src="logo-01.svg" alt="eezyGet" class="footer-center-logo-svg">
        </div>
    </div>
</div>
`;

// SVG logo is now static across all pages

// Initialize header and footer
function initHeaderFooter() {
    // Load header
    const header = document.querySelector('.header');
    if (header) {
        header.innerHTML = headerHTML;
        
        // SVG logo is now static, no need to change based on page
        
        // Set active navigation link
        setActiveNavLink();
        
        // Initialize language selector
        initLanguageSelector();
        
        // Initialize mobile menu after header is loaded
        setTimeout(initMobileMenu, 100);
    }
    
    // Load footer
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.innerHTML = footerHTML;
        
        // Update current year
        const currentYear = new Date().getFullYear();
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = currentYear;
        }
    }
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Mobile menu functionality (moved from script.js to avoid duplication)
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navigation = document.getElementById('navigation');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (mobileMenuToggle && navigation && mobileOverlay) {
        // Remove existing event listeners to avoid duplicates
        mobileMenuToggle.removeEventListener('click', toggleMobileMenu);
        mobileOverlay.removeEventListener('click', closeMobileMenu);
        
        // Add event listeners
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        mobileOverlay.addEventListener('click', closeMobileMenu);
        
        // Close menu when clicking anywhere on the page (except the menu itself)
        document.addEventListener('click', function(e) {
            if (navigation.classList.contains('active')) {
                // Don't close if clicking on the menu toggle button or the navigation itself
                if (!mobileMenuToggle.contains(e.target) && !navigation.contains(e.target)) {
                    closeMobileMenu();
                }
            }
        });
        
        // Close menu with ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navigation.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        // Close menu when clicking on nav links
        const navLinks = navigation.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.removeEventListener('click', closeMobileMenu);
            link.addEventListener('click', closeMobileMenu);
        });
    }
}

function toggleMobileMenu() {
    const navigation = document.getElementById('navigation');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    
    if (navigation && mobileOverlay && toggleBtn) {
        navigation.classList.toggle('mobile');
        navigation.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        toggleBtn.classList.toggle('active');
        
        // Update navigation text when opening menu
        if (navigation.classList.contains('active')) {
            const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
            updateNavigationText(currentLang);
        }
    }
}

function closeMobileMenu() {
    const navigation = document.getElementById('navigation');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    
    if (navigation && mobileOverlay && toggleBtn) {
        navigation.classList.remove('mobile', 'active');
        mobileOverlay.classList.remove('active');
        toggleBtn.classList.remove('active');
    }
}

// Initialize language selector
function initLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        // Load saved language preference
        const savedLang = localStorage.getItem('selectedLanguage') || 'tr';
        languageSelect.value = savedLang;
        
        // Update navigation on initial load
        updateNavigationText(savedLang);
        
        // Add change event listener
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            localStorage.setItem('selectedLanguage', selectedLang);
            
            // Update navigation text immediately
            updateNavigationText(selectedLang);
            
            // Trigger language change event for page-specific handlers
            const event = new CustomEvent('languageChanged', { detail: { language: selectedLang } });
            document.dispatchEvent(event);
        });
    }
}

// Update navigation text based on language
function updateNavigationText(lang) {
    // Check if platformTranslations is available
    if (typeof platformTranslations === 'undefined') {
        setTimeout(() => updateNavigationText(lang), 100);
        return;
    }
    
    const translations = platformTranslations[lang] || platformTranslations.tr;
    const nav = translations.navigation || {};
    
    // Update navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const dataNav = link.getAttribute('data-nav');
        
        if (href === 'index.html' || href === '/' || dataNav === 'home') {
            link.innerHTML = `<i class="fas fa-home"></i> ${nav.home || 'Ana Sayfa'}`;
        } else if (href === 'spotify.html') {
            link.innerHTML = `<i class="fab fa-spotify"></i> ${nav.spotify || 'Spotify'}`;
        } else if (href === 'youtube.html') {
            link.innerHTML = `<i class="fab fa-youtube"></i> ${nav.youtube || 'YouTube'}`;
        } else if (href === 'instagram.html') {
            link.innerHTML = `<i class="fab fa-instagram"></i> Instagram`;
        } else if (href === 'tiktok.html') {
            link.innerHTML = `<i class="fab fa-tiktok"></i> TikTok`;
        } else if (href === 'soundcloud.html') {
            link.innerHTML = `<i class="fab fa-soundcloud"></i> SoundCloud`;
        } else if (href === 'facebook.html') {
            link.innerHTML = `<i class="fab fa-facebook"></i> Facebook`;
        } else if (href === 'vimeo.html') {
            link.innerHTML = `<i class="fab fa-vimeo"></i> Vimeo`;
        }
    });
}

// Export functions for use in other scripts
window.headerFooterSystem = {
    init: initHeaderFooter,
    setActiveNavLink: setActiveNavLink,
    toggleMobileMenu: toggleMobileMenu,
    closeMobileMenu: closeMobileMenu,
    initLanguageSelector: initLanguageSelector,
    updateNavigationText: updateNavigationText
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initHeaderFooter();
});