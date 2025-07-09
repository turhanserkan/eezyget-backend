// The script.js file now uses platformTranslations from platform-translations.js
// No local translations needed as they are handled by the PlatformLanguageManager

// DOM elements - will be initialized after DOM loads
let langSelect, spotifyUrlInput, downloadBtn, downloadOptions, formatBtns, qualityBtns, previewBtn, processBtn, previewSection;

// State
let currentFormat = 'audio';
let currentQuality = '320';
let currentUrl = '';
let previewData = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements after page load
    langSelect = document.getElementById('language-select');
    spotifyUrlInput = document.getElementById('spotify-url') || document.getElementById('youtube-url');
    downloadBtn = document.getElementById('download-btn');
    downloadOptions = document.getElementById('download-options');
    formatBtns = document.querySelectorAll('.format-btn');
    qualityBtns = document.querySelectorAll('.quality-btn');
    previewBtn = document.getElementById('preview-btn');
    processBtn = document.getElementById('process-btn');
    previewSection = document.getElementById('preview-section');
    
    // Mobile menu functionality is now handled by header-footer.js
    
    // Language switching is now handled by header-footer.js
    // Multiple attempts to ensure content updates
    setTimeout(updateContent, 100);
    setTimeout(updateContent, 300);
    setTimeout(updateContent, 500);
    
    // Listen for language changes from header-footer.js
    document.addEventListener('languageChanged', function(e) {
        console.log('Language changed event received:', e.detail.language);
        // Multiple attempts to ensure placeholder is updated
        setTimeout(updateContent, 10);
        setTimeout(updateContent, 50);
        setTimeout(updateContent, 100);
        setTimeout(updateContent, 200);
    });
    
    // Also try updating content when translations are definitely loaded
    if (typeof platformTranslations !== 'undefined') {
        updateContent();
    }
    
    // Force update after a longer delay as last resort
    setTimeout(function() {
        if (typeof platformTranslations !== 'undefined') {
            updateContent();
        }
    }, 1000);
    
    // Watch for DOM changes that might affect the input element
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // Check if URL input exists and needs placeholder update
                const urlInput = document.querySelector('.url-input');
                if (urlInput && (!urlInput.placeholder || urlInput.placeholder === '')) {
                    console.log('URL input found without placeholder, updating...');
                    setTimeout(updateContent, 50);
                }
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['placeholder']
    });

    // Download button click handler
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }

    // Enter key handler for input
    if (spotifyUrlInput) {
        spotifyUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleDownload();
            }
        });

        // Input validation and options panel toggle
        spotifyUrlInput.addEventListener('input', function() {
            const url = this.value.trim();
            currentUrl = url;
            
            if (url && isValidUrl(url)) {
                this.style.borderColor = '#1db954';
                showOptionsPanel();
            } else if (url && !isValidUrl(url)) {
                this.style.borderColor = '#ff4444';
                hideOptionsPanel();
            } else {
                this.style.borderColor = '';
                hideOptionsPanel();
            }
        });
    }

    // Format selector
    if (formatBtns && formatBtns.length > 0) {
        formatBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                formatBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFormat = this.dataset.format;
                updateQualityOptions();
                
                // Update preview if visible
                if (previewData && previewSection && previewSection.style.display !== 'none') {
                    updatePreviewInfo();
                }
            });
        });
    }

    // Quality selector
    if (qualityBtns && qualityBtns.length > 0) {
        qualityBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                qualityBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentQuality = this.dataset.quality;
                
                // Update preview if visible
                if (previewData && previewSection && previewSection.style.display !== 'none') {
                    updatePreviewInfo();
                }
            });
        });
    }

    // Preview button
    if (previewBtn) {
        previewBtn.addEventListener('click', handlePreview);
    }

    // Process button
    if (processBtn) {
        processBtn.addEventListener('click', handleProcess);
    }
    
    // Update current year automatically
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = currentYear;
    }
    
    // Initialize backend connection check
    checkBackendHealth().then(isBackendHealthy => {
        if (!isBackendHealthy) {
            const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
            showNotification(
                currentLang === 'tr' ? 
                'Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' : 
                'Could not connect to server. Please try again later.',
                'error'
            );
            
            // Disable download button
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + 
                    (currentLang === 'tr' ? 'Sunucu Offline' : 'Server Offline');
            }
        } else {
            // Initialize Socket.IO connection
            initializeSocket();
        }
    });
});

// Mobile menu functionality is now handled by header-footer.js
// These functions are removed to avoid duplication

// Switch language function
function switchLanguage(lang) {
    currentLang = lang;
    
    // Update select value
    if (langSelect) {
        langSelect.value = lang;
    }
    
    // Save language preference
    localStorage.setItem('selectedLanguage', lang);

    // Update page content
    updateContent();
}

// Update page content based on current language
function updateContent() {
    // Check if platformTranslations is available
    if (typeof platformTranslations === 'undefined') {
        console.log('platformTranslations not available, retrying...');
        setTimeout(updateContent, 100);
        return;
    }
    
    const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
    const translations = platformTranslations[currentLang] || platformTranslations.tr;
    const t = translations.common || {};
    
    // Detect current platform from page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let platformKey = 'common';
    if (currentPage === 'spotify.html') {
        platformKey = 'spotify';
    } else if (currentPage === 'youtube.html') {
        platformKey = 'youtube';
    }
    
    console.log('Updating content - Lang:', currentLang, 'Platform:', platformKey, 'Page:', currentPage);
    
    const platformT = translations[platformKey] || {};

    // Update input placeholder with platform-specific text
    const urlInput = document.querySelector('.url-input');
    console.log('URL Input found:', !!urlInput);
    
    if (urlInput) {
        let placeholder = platformT.placeholder || t.placeholder;
        
        console.log('Platform placeholder:', platformT.placeholder);
        console.log('Common placeholder:', t.placeholder);
        
        // Fallback placeholders if translation not found
        if (!placeholder) {
            if (platformKey === 'spotify') {
                placeholder = currentLang === 'en' ? 'Paste Spotify link here...' : 'Spotify linkini buraya yapıştırın...';
            } else if (platformKey === 'youtube') {
                placeholder = currentLang === 'en' ? 'Paste YouTube link here...' : 'YouTube linkini buraya yapıştırın...';
            } else {
                placeholder = currentLang === 'en' ? 'Paste link here...' : 'Linki buraya yapıştırın...';
            }
        }
        
        console.log('Final placeholder:', placeholder);
        
        // Multiple methods to ensure placeholder is set
        urlInput.placeholder = placeholder;
        urlInput.setAttribute('placeholder', placeholder);
        
        // Force a style recalculation
        urlInput.style.display = 'none';
        urlInput.offsetHeight; // Trigger reflow
        urlInput.style.display = '';
        
        // Set again after reflow
        urlInput.placeholder = placeholder;
        urlInput.setAttribute('placeholder', placeholder);
        
        // Double check if it was set
        console.log('Placeholder after setting:', urlInput.placeholder);
        console.log('Placeholder attribute:', urlInput.getAttribute('placeholder'));
    }

    // Update hero title and subtitle if they exist
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && platformT.heroTitle) {
        heroTitle.textContent = platformT.heroTitle;
    }
    
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && platformT.heroSubtitle) {
        heroSubtitle.textContent = platformT.heroSubtitle;
    }

    // Update download button
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn && t.download) {
        downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${t.download}`;
    }

    // Update other UI elements if they exist
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn && t.preview) {
        previewBtn.innerHTML = `<i class="fas fa-eye"></i> ${t.preview}`;
    }

    const processBtn = document.getElementById('process-btn');
    if (processBtn && t.download) {
        processBtn.innerHTML = `<i class="fas fa-download"></i> ${t.download}`;
    }
}

// Validate Spotify URL
function isValidSpotifyUrl(url) {
    const spotifyRegex = /^https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyRegex.test(url);
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    return youtubeRegex.test(url);
}

// Validate any supported URL
function isValidUrl(url) {
    return isValidSpotifyUrl(url) || isValidYouTubeUrl(url);
}

// Handle download
async function handleDownload() {
    if (!spotifyUrlInput) return;
    
    const url = spotifyUrlInput.value.trim();
    const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
    const t = platformTranslations[currentLang]?.common || {};

    if (!url) {
        showNotification(t.invalidUrl || 'Geçersiz link!', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showNotification(t.invalidUrl || 'Geçersiz link!', 'error');
        return;
    }

    // Show processing state
    const originalText = downloadBtn ? downloadBtn.innerHTML : '';
    if (downloadBtn) {
        downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.processing || 'İşleniyor...'}`;
        downloadBtn.disabled = true;
    }

    try {
        // Determine download type and endpoint based on URL
        let endpoint;
        let urlType = null;
        
        if (isValidSpotifyUrl(url)) {
            urlType = getSpotifyUrlType(url);
            if (urlType === 'track') {
                endpoint = '/api/download/track';
            } else if (urlType === 'playlist') {
                endpoint = '/api/download/playlist';
            } else if (urlType === 'album') {
                endpoint = '/api/download/album';
            } else {
                throw new Error(t.invalidUrl);
            }
        } else if (isValidYouTubeUrl(url)) {
            endpoint = '/api/youtube/download';
            urlType = 'youtube';
        } else {
            throw new Error(t.invalidUrl);
        }

        // Make API request
        const response = await fetch(`https://api.eezyget.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                format: 'mp3',
                quality: '320'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
        }

        const data = await response.json();

        if (data.success) {
            // Set active download ID and join Socket.IO room
            activeDownloadId = data.data.jobId;
            if (socket && socket.connected) {
                socket.emit('join-download', activeDownloadId);
            }
            
            // Show success message
            const successMsg = currentLang === 'tr' ? 'İndirme başlatıldı!' : 'Download started!';
            showNotification(successMsg, 'success');
            
            // If it's a single track or YouTube video, start download immediately
            if (urlType === 'track' || urlType === 'youtube') {
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = `https://api.eezyget.com${data.data.downloadUrl}`;
                downloadLink.download = data.data.filename;
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } else {
                // For playlists/albums, show download link
                showDownloadLink(data.data);
            }
            
            // Clear input
            if (spotifyUrlInput) {
                spotifyUrlInput.value = '';
            }
        } else {
            throw new Error(data.message || 'Download failed');
        }

    } catch (error) {
        console.error('Download error:', error);
        const errorMsg = error.message || (currentLang === 'tr' ? 'İndirme başarısız!' : 'Download failed!');
        showNotification(errorMsg, 'error');
    } finally {
        // Reset button
        if (downloadBtn) {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : '#1db954'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration
function formatDuration(seconds) {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Get Spotify URL type
function getSpotifyUrlType(url) {
    const match = url.match(/https:\/\/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/);
    return match ? match[1] : null;
}

// Show download link for playlists/albums
function showDownloadLink(data) {
    const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
    const t = platformTranslations[currentLang]?.common || {};
    
    // Create download modal
    const modal = document.createElement('div');
    modal.className = 'download-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${currentLang === 'tr' ? 'İndirme Hazır' : 'Download Ready'}</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="download-info">
                    <p><strong>${currentLang === 'tr' ? 'Dosya:' : 'File:'}</strong> ${data.filename}</p>
                    <p><strong>${currentLang === 'tr' ? 'Boyut:' : 'Size:'}</strong> ${formatFileSize(data.fileSize)}</p>
                    ${data.totalTracks ? `<p><strong>${currentLang === 'tr' ? 'Toplam Şarkı:' : 'Total Tracks:'}</strong> ${data.completedTracks}/${data.totalTracks}</p>` : ''}
                </div>
                <div class="download-actions">
                    <a href="https://api.eezyget.com${data.downloadUrl}" download="${data.filename}" class="download-link">
                        <i class="fas fa-download"></i>
                        ${currentLang === 'tr' ? 'İndir' : 'Download'}
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        float: right;
        color: #666;
    `;
    
    const downloadLink = modal.querySelector('.download-link');
    downloadLink.style.cssText = `
        display: inline-block;
        background: #1db954;
        color: white;
        padding: 1rem 2rem;
        text-decoration: none;
        border-radius: 10px;
        font-weight: 600;
        margin-top: 1rem;
        transition: background 0.3s ease;
    `;
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.download-modal');
    if (modal) {
        modal.remove();
    }
}

// API Configuration
const API_BASE_URL = 'https://api.eezyget.com';

// Socket.IO Configuration
let socket = null;
let activeDownloadId = null;

// Initialize Socket.IO connection
function initializeSocket() {
    if (socket) return;
    
    socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('Socket.IO connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
    });
    
    socket.on('download-progress', (data) => {
        updateDownloadProgress(data);
    });
}

// Update download progress
function updateDownloadProgress(data) {
    const { jobId, status, progress, message, filename, fileSize } = data;
    
    // Update download button if this is the active download
    if (activeDownloadId === jobId && downloadBtn) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
        
        if (status === 'completed') {
            downloadBtn.innerHTML = `<i class="fas fa-check"></i> ${currentLang === 'tr' ? 'Tamamlandı' : 'Completed'}`;
            downloadBtn.disabled = false;
            activeDownloadId = null;
            
            // Show success notification
            showNotification(
                currentLang === 'tr' ? 'İndirme tamamlandı!' : 'Download completed!',
                'success'
            );
        } else if (status === 'failed') {
            downloadBtn.innerHTML = `<i class="fas fa-times"></i> ${currentLang === 'tr' ? 'Başarısız' : 'Failed'}`;
            downloadBtn.disabled = false;
            activeDownloadId = null;
            
            // Show error notification
            showNotification(message || 'Download failed', 'error');
        } else {
            // Show progress
            downloadBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i> 
                ${message} (${progress}%)
            `;
            downloadBtn.disabled = true;
        }
    }
    
    // Update process button if visible
    if (activeDownloadId === jobId && processBtn) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
        
        if (status === 'completed') {
            processBtn.innerHTML = `<i class="fas fa-check"></i> ${currentLang === 'tr' ? 'Tamamlandı' : 'Completed'}`;
            processBtn.disabled = false;
        } else if (status === 'failed') {
            processBtn.innerHTML = `<i class="fas fa-times"></i> ${currentLang === 'tr' ? 'Başarısız' : 'Failed'}`;
            processBtn.disabled = false;
        } else {
            processBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i> 
                ${message} (${progress}%)
            `;
            processBtn.disabled = true;
        }
    }
}

// Health check
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}

// Show/Hide options panel
function showOptionsPanel() {
    if (!downloadOptions) return;
    
    downloadOptions.style.display = 'block';
    
    // Hide video options for Spotify URLs (only if video button exists)
    const videoBtn = document.querySelector('.format-btn[data-format="video"]');
    const audioBtn = document.querySelector('.format-btn[data-format="audio"]');
    
    if (isValidSpotifyUrl(currentUrl)) {
        if (videoBtn) {
            videoBtn.style.display = 'none';
        }
        currentFormat = 'audio';
        formatBtns.forEach(b => b.classList.remove('active'));
        if (audioBtn) {
            audioBtn.classList.add('active');
        }
    } else {
        if (videoBtn) {
            videoBtn.style.display = 'block';
        }
    }
    
    updateQualityOptions();
}

function hideOptionsPanel() {
    if (downloadOptions) {
        downloadOptions.style.display = 'none';
    }
    if (previewSection) {
        previewSection.style.display = 'none';
    }
}

// Update quality options based on format
function updateQualityOptions() {
    const audioQuality = document.querySelector('.audio-quality');
    const videoQuality = document.querySelector('.video-quality');
    
    if (currentFormat === 'audio') {
        if (audioQuality) audioQuality.style.display = 'flex';
        if (videoQuality) videoQuality.style.display = 'none';
        
        // Set default audio quality
        qualityBtns.forEach(b => b.classList.remove('active'));
        const quality320Btn = document.querySelector('.quality-btn[data-quality="320"]');
        if (quality320Btn) {
            quality320Btn.classList.add('active');
        }
        currentQuality = '320';
    } else {
        if (audioQuality) audioQuality.style.display = 'none';
        if (videoQuality) videoQuality.style.display = 'flex';
        
        // Set default video quality
        qualityBtns.forEach(b => b.classList.remove('active'));
        const quality480Btn = document.querySelector('.quality-btn[data-quality="480"]');
        if (quality480Btn) {
            quality480Btn.classList.add('active');
        }
        currentQuality = '480';
    }
}

// Handle preview
async function handlePreview() {
    console.log('Preview clicked! currentUrl:', currentUrl, 'previewBtn:', previewBtn);
    if (!currentUrl || !previewBtn) {
        console.log('Early return - currentUrl or previewBtn missing');
        return;
    }
    
    try {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        
        let endpoint;
        if (isValidSpotifyUrl(currentUrl)) {
            endpoint = '/api/spotify/parse';
        } else if (isValidYouTubeUrl(currentUrl)) {
            endpoint = '/api/youtube/info';
        }
        
        console.log('Making request to:', `${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: currentUrl })
        });
        
        const data = await response.json();
        
        if (data.success) {
            previewData = data.data;
            showPreview(previewData);
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Preview error:', error);
        showNotification('Önizleme yüklenemedi: ' + error.message, 'error');
    } finally {
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.innerHTML = '<i class="fas fa-eye"></i> Önizle';
        }
    }
}

// Show preview
function showPreview(data) {
    const previewImage = document.getElementById('preview-image');
    const previewVideo = document.getElementById('preview-video');
    const previewVideoSrc = document.getElementById('preview-video-src');
    const previewTitle = document.getElementById('preview-title');
    const previewArtist = document.getElementById('preview-artist');
    const previewDuration = document.getElementById('preview-duration');
    const previewSize = document.getElementById('preview-size');
    const previewFormat = document.getElementById('preview-format');
    
    if (isValidSpotifyUrl(currentUrl)) {
        // Spotify - always show image
        if (previewImage) previewImage.style.display = 'block';
        if (previewVideo) previewVideo.style.display = 'none';
        
        const track = data.data || data;
        if (previewImage) previewImage.src = track.album?.images[0]?.url || '';
        if (previewTitle) previewTitle.textContent = track.name || 'Unknown Track';
        if (previewArtist) previewArtist.textContent = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
        if (previewDuration) previewDuration.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(track.duration_ms / 1000)}`;
    } else {
        // YouTube - show thumbnail for both audio and video formats
        if (previewImage) {
            previewImage.style.display = 'block';
            previewImage.src = data.thumbnails?.[data.thumbnails.length - 1]?.url || '';
        }
        if (previewVideo) previewVideo.style.display = 'none';
        
        if (previewTitle) previewTitle.textContent = data.title || 'Unknown Video';
        if (previewArtist) previewArtist.textContent = data.author?.name || 'Unknown Channel';
        if (previewDuration) previewDuration.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(data.lengthSeconds)}`;
    }
    
    // Estimate file size and show format info
    const estimatedSize = estimateFileSize(previewData, currentFormat, currentQuality);
    const formatInfo = currentFormat === 'audio' ? `MP3 ${currentQuality}kbps` : `MP4 ${currentQuality}p`;
    if (previewSize) previewSize.innerHTML = `<i class="fas fa-file"></i> ~${estimatedSize}`;
    if (previewFormat) previewFormat.innerHTML = `<i class="fas fa-cog"></i> ${formatInfo}`;
    
    if (previewSection) previewSection.style.display = 'block';
}

// Extract YouTube video ID
function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Update preview info (when quality/format changes)
function updatePreviewInfo() {
    if (!previewData) return;
    
    const previewSize = document.getElementById('preview-size');
    const previewFormat = document.getElementById('preview-format');
    const estimatedSize = estimateFileSize(previewData, currentFormat, currentQuality);
    const formatInfo = currentFormat === 'audio' ? `MP3 ${currentQuality}kbps` : `MP4 ${currentQuality}p`;
    if (previewSize) previewSize.innerHTML = `<i class="fas fa-file"></i> ~${estimatedSize}`;
    if (previewFormat) previewFormat.innerHTML = `<i class="fas fa-cog"></i> ${formatInfo}`;
    
    // Update video/image preview for YouTube
    if (isValidYouTubeUrl(currentUrl)) {
        const previewImage = document.getElementById('preview-image');
        const previewVideo = document.getElementById('preview-video');
        
        // Always show thumbnail for YouTube (both audio and video formats)
        if (previewImage) {
            previewImage.style.display = 'block';
            previewImage.src = previewData.thumbnails?.[previewData.thumbnails.length - 1]?.url || '';
        }
        if (previewVideo) previewVideo.style.display = 'none';
    }
}

// Estimate file size
function estimateFileSize(data, format, quality) {
    let duration;
    if (isValidSpotifyUrl(currentUrl)) {
        duration = (data.data?.duration_ms || data.duration_ms) / 1000;
    } else {
        duration = data.lengthSeconds;
    }
    
    if (format === 'audio') {
        const bitrate = parseInt(quality);
        const sizeBytes = (duration * bitrate * 1000) / 8;
        return formatFileSize(sizeBytes);
    } else {
        // Video size estimation (rough)
        const qualityMultiplier = {
            '144': 0.5,
            '240': 1,
            '360': 2,
            '480': 4,
            '720': 8,
            '1080': 16
        };
        const sizeBytes = duration * qualityMultiplier[quality] * 1024 * 1024;
        return formatFileSize(sizeBytes);
    }
}

// Handle process (download)
async function handleProcess() {
    return await handleDownloadWithOptions();
}

// Update old download function to use new options
async function handleDownloadWithOptions() {
    const url = currentUrl;
    const format = currentFormat === 'audio' ? 'mp3' : 'mp4';
    const quality = currentQuality;
    
    const currentLang = localStorage.getItem('selectedLanguage') || 'tr';
    const t = platformTranslations[currentLang]?.common || {};

    if (!url || !isValidUrl(url)) {
        showNotification(t.invalidUrl, 'error');
        return;
    }

    try {
        let endpoint;
        let urlType = null;
        
        if (isValidSpotifyUrl(url)) {
            urlType = getSpotifyUrlType(url);
            if (urlType === 'track') {
                endpoint = '/api/download/track';
            } else if (urlType === 'playlist') {
                endpoint = '/api/download/playlist';
            } else if (urlType === 'album') {
                endpoint = '/api/download/album';
            } else {
                throw new Error(t.invalidUrl);
            }
        } else if (isValidYouTubeUrl(url)) {
            endpoint = '/api/youtube/download';
            urlType = 'youtube';
        } else {
            throw new Error(t.invalidUrl);
        }

        if (processBtn) {
            processBtn.disabled = true;
            processBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.processing}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, format, quality })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
        }

        const data = await response.json();

        if (data.success) {
            // Set active download ID and join Socket.IO room
            activeDownloadId = data.data.jobId;
            if (socket && socket.connected) {
                socket.emit('join-download', activeDownloadId);
            }
            
            showNotification(
                currentLang === 'tr' ? 'İndirme başlatıldı!' : 'Download started!', 
                'success'
            );
            
            if (urlType === 'track' || urlType === 'youtube') {
                const downloadLink = document.createElement('a');
                downloadLink.href = `${API_BASE_URL}${data.data.downloadUrl}`;
                downloadLink.download = data.data.filename;
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } else {
                showDownloadLink(data.data);
            }
            
            if (spotifyUrlInput) {
                spotifyUrlInput.value = '';
            }
            hideOptionsPanel();
        } else {
            throw new Error(data.message || 'Download failed');
        }

    } catch (error) {
        console.error('Download error:', error);
        const errorMsg = error.message || (currentLang === 'tr' ? 'İndirme başarısız!' : 'Download failed!');
        showNotification(errorMsg, 'error');
    } finally {
        if (processBtn) {
            processBtn.disabled = false;
            processBtn.innerHTML = '<i class="fas fa-download"></i> İndir';
        }
    }
}

