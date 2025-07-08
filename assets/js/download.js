// Language translations
const translations = {
    tr: {
        heroTitle: "Spotify Müzik İndirici",
        heroSubtitle: "Spotify şarkıları, playlistleri ve YouTube videolarını ücretsiz MP3 formatında indirin",
        placeholder: "Spotify veya YouTube linkini buraya yapıştırın...",
        downloadBtn: "İndir",
        features: {
            quality: "Yüksek Kalite",
            speed: "Hızlı İndirme",
            devices: "Tüm Cihazlar",
            secure: "Güvenli"
        },
        howToUse: "Nasıl Kullanılır?",
        steps: {
            step1: {
                title: "Spotify Linkini Kopyala",
                description: "İndirmek istediğiniz şarkı veya playlist linkini Spotify'dan kopyalayın"
            },
            step2: {
                title: "Linki Yapıştır",
                description: "Kopyaladığınız linki yukarıdaki kutucuğa yapıştırın"
            },
            step3: {
                title: "İndirme Başlat",
                description: '"İndir" butonuna tıklayın ve müziğinizin hazır olmasını bekleyin'
            }
        },
        supportedFormats: "Desteklenen Formatlar",
        footer: `© ${new Date().getFullYear()} eezyGet. Tüm hakları saklıdır.`,
        disclaimer: "Bu site yalnızca eğitim amaçlıdır. Telif hakkı yasalarına uygun hareket edin.",
        invalidUrl: "Geçersiz link! Lütfen geçerli bir Spotify veya YouTube linki girin.",
        processing: "İşleniyor...",
        download: "İndir"
    },
    en: {
        heroTitle: "Spotify Music Downloader",
        heroSubtitle: "Download Spotify songs, playlists and YouTube videos in MP3 format for free",
        placeholder: "Paste Spotify or YouTube link here...",
        downloadBtn: "Download",
        features: {
            quality: "High Quality",
            speed: "Fast Download",
            devices: "All Devices",
            secure: "Secure"
        },
        howToUse: "How to Use?",
        steps: {
            step1: {
                title: "Copy Spotify Link",
                description: "Copy the link of the song or playlist you want to download from Spotify"
            },
            step2: {
                title: "Paste Link",
                description: "Paste the copied link into the box above"
            },
            step3: {
                title: "Start Download",
                description: 'Click the "Download" button and wait for your music to be ready'
            }
        },
        supportedFormats: "Supported Formats",
        footer: `© ${new Date().getFullYear()} eezyGet. All rights reserved.`,
        disclaimer: "This site is for educational purposes only. Please comply with copyright laws.",
        invalidUrl: "Invalid link! Please enter a valid Spotify or YouTube link.",
        processing: "Processing...",
        download: "Download"
    }
};

// Current language
let currentLang = 'tr';

// DOM elements
const langButtons = document.querySelectorAll('.lang-btn');
const spotifyUrlInput = document.getElementById('spotify-url');
const downloadBtn = document.getElementById('download-btn');
const downloadOptions = document.getElementById('download-options');
const formatBtns = document.querySelectorAll('.format-btn');
const qualityBtns = document.querySelectorAll('.quality-btn');
const previewBtn = document.getElementById('preview-btn');
const processBtn = document.getElementById('process-btn');
const previewSection = document.getElementById('preview-section');

// State
let currentFormat = 'audio';
let currentQuality = '320';
let currentUrl = '';
let previewData = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Language switcher
    langButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            switchLanguage(lang);
        });
    });

    // Download button click handler
    downloadBtn.addEventListener('click', handleDownload);

    // Enter key handler for input
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

    // Format selector
    formatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            formatBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFormat = this.dataset.format;
            updateQualityOptions();
            
            // Update preview if visible
            if (previewData && previewSection.style.display !== 'none') {
                updatePreviewInfo();
            }
        });
    });

    // Quality selector
    qualityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            qualityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentQuality = this.dataset.quality;
            
            // Update preview if visible
            if (previewData && previewSection.style.display !== 'none') {
                updatePreviewInfo();
            }
        });
    });

    // Preview button
    previewBtn.addEventListener('click', handlePreview);

    // Process button
    processBtn.addEventListener('click', handleProcess);
});

// Switch language function
function switchLanguage(lang) {
    currentLang = lang;
    
    // Update active language button
    langButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });

    // Update page content
    updateContent();
}

// Update page content based on current language
function updateContent() {
    const t = translations[currentLang];

    // Update hero section
    document.querySelector('.hero-title').textContent = t.heroTitle;
    document.querySelector('.hero-subtitle').textContent = t.heroSubtitle;
    document.querySelector('.url-input').placeholder = t.placeholder;
    document.querySelector('.download-btn').innerHTML = `<i class="fas fa-download"></i> ${t.downloadBtn}`;

    // Update features
    const featureItems = document.querySelectorAll('.feature-item span');
    featureItems[0].textContent = t.features.quality;
    featureItems[1].textContent = t.features.speed;
    featureItems[2].textContent = t.features.devices;
    featureItems[3].textContent = t.features.secure;

    // Update how to use section
    document.querySelector('.how-to-use h2').textContent = t.howToUse;
    const stepTitles = document.querySelectorAll('.step-content h3');
    const stepDescriptions = document.querySelectorAll('.step-content p');
    
    stepTitles[0].textContent = t.steps.step1.title;
    stepDescriptions[0].textContent = t.steps.step1.description;
    stepTitles[1].textContent = t.steps.step2.title;
    stepDescriptions[1].textContent = t.steps.step2.description;
    stepTitles[2].textContent = t.steps.step3.title;
    stepDescriptions[2].textContent = t.steps.step3.description;

    // Update supported formats
    document.querySelector('.supported-formats h2').textContent = t.supportedFormats;

    // Update footer
    document.querySelector('.footer p:first-child').textContent = t.footer;
    document.querySelector('.disclaimer').textContent = t.disclaimer;
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
    const url = spotifyUrlInput.value.trim();
    const t = translations[currentLang];

    if (!url) {
        showNotification(t.invalidUrl, 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showNotification(t.invalidUrl, 'error');
        return;
    }

    // Show processing state
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.processing}`;
    downloadBtn.disabled = true;

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
        const response = await fetch(`https://eezyget.up.railway.app${endpoint}`, {
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
            // Show success message
            showNotification(
                currentLang === 'tr' ? 'İndirme başarılı!' : 'Download successful!', 
                'success'
            );
            
            // If it's a single track or YouTube video, start download immediately
            if (urlType === 'track' || urlType === 'youtube') {
                // Create download link
                const downloadLink = document.createElement('a');
                downloadLink.href = `https://eezyget.up.railway.app${data.data.downloadUrl}`;
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
            spotifyUrlInput.value = '';
        } else {
            throw new Error(data.message || 'Download failed');
        }

    } catch (error) {
        console.error('Download error:', error);
        showNotification(
            error.message || (currentLang === 'tr' ? 'İndirme başarısız!' : 'Download failed!'), 
            'error'
        );
    } finally {
        // Reset button
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
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
    const t = translations[currentLang];
    
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
                    <a href="https://eezyget.up.railway.app${data.downloadUrl}" download="${data.filename}" class="download-link">
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
const API_BASE_URL = 'https://eezyget.up.railway.app';

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
    downloadOptions.style.display = 'block';
    
    // Hide video options for Spotify URLs
    if (isValidSpotifyUrl(currentUrl)) {
        document.querySelector('.format-btn[data-format="video"]').style.display = 'none';
        currentFormat = 'audio';
        formatBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.format-btn[data-format="audio"]').classList.add('active');
    } else {
        document.querySelector('.format-btn[data-format="video"]').style.display = 'block';
    }
    
    updateQualityOptions();
}

function hideOptionsPanel() {
    downloadOptions.style.display = 'none';
    previewSection.style.display = 'none';
}

// Update quality options based on format
function updateQualityOptions() {
    const audioQuality = document.querySelector('.audio-quality');
    const videoQuality = document.querySelector('.video-quality');
    
    if (currentFormat === 'audio') {
        audioQuality.style.display = 'flex';
        videoQuality.style.display = 'none';
        
        // Set default audio quality
        qualityBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.quality-btn[data-quality="320"]').classList.add('active');
        currentQuality = '320';
    } else {
        audioQuality.style.display = 'none';
        videoQuality.style.display = 'flex';
        
        // Set default video quality
        qualityBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.quality-btn[data-quality="480"]').classList.add('active');
        currentQuality = '480';
    }
}

// Handle preview
async function handlePreview() {
    if (!currentUrl) return;
    
    try {
        previewBtn.disabled = true;
        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        
        let endpoint;
        if (isValidSpotifyUrl(currentUrl)) {
            endpoint = '/api/spotify/parse';
        } else if (isValidYouTubeUrl(currentUrl)) {
            endpoint = '/api/youtube/info';
        }
        
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
        showNotification('Önizleme yüklenemedi: ' + error.message, 'error');
    } finally {
        previewBtn.disabled = false;
        previewBtn.innerHTML = '<i class="fas fa-eye"></i> Önizle';
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
        previewImage.style.display = 'block';
        previewVideo.style.display = 'none';
        
        const track = data.data || data;
        previewImage.src = track.album?.images[0]?.url || '';
        previewTitle.textContent = track.name || 'Unknown Track';
        previewArtist.textContent = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
        previewDuration.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(track.duration_ms / 1000)}`;
    } else {
        // YouTube - show video preview if video format selected
        if (currentFormat === 'video') {
            previewImage.style.display = 'none';
            previewVideo.style.display = 'block';
            
            // Create a preview video URL (YouTube embed)
            const videoId = extractYouTubeId(currentUrl);
            if (videoId) {
                previewVideoSrc.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`;
                previewVideo.load();
            }
        } else {
            previewImage.style.display = 'block';
            previewVideo.style.display = 'none';
            previewImage.src = data.thumbnails?.[data.thumbnails.length - 1]?.url || '';
        }
        
        previewTitle.textContent = data.title || 'Unknown Video';
        previewArtist.textContent = data.author?.name || 'Unknown Channel';
        previewDuration.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(data.lengthSeconds)}`;
    }
    
    // Estimate file size and show format info
    const estimatedSize = estimateFileSize(previewData, currentFormat, currentQuality);
    const formatInfo = currentFormat === 'audio' ? `MP3 ${currentQuality}kbps` : `MP4 ${currentQuality}p`;
    previewSize.innerHTML = `<i class="fas fa-file"></i> ~${estimatedSize}`;
    previewFormat.innerHTML = `<i class="fas fa-cog"></i> ${formatInfo}`;
    
    previewSection.style.display = 'block';
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
    previewSize.innerHTML = `<i class="fas fa-file"></i> ~${estimatedSize}`;
    previewFormat.innerHTML = `<i class="fas fa-cog"></i> ${formatInfo}`;
    
    // Update video/image preview for YouTube
    if (isValidYouTubeUrl(currentUrl)) {
        const previewImage = document.getElementById('preview-image');
        const previewVideo = document.getElementById('preview-video');
        const previewVideoSrc = document.getElementById('preview-video-src');
        
        if (currentFormat === 'video') {
            previewImage.style.display = 'none';
            previewVideo.style.display = 'block';
            
            const videoId = extractYouTubeId(currentUrl);
            if (videoId) {
                previewVideoSrc.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`;
                previewVideo.load();
            }
        } else {
            previewImage.style.display = 'block';
            previewVideo.style.display = 'none';
            previewImage.src = previewData.thumbnails?.[previewData.thumbnails.length - 1]?.url || '';
        }
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
    
    const t = translations[currentLang];

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

        processBtn.disabled = true;
        processBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t.processing}`;

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
            showNotification(
                currentLang === 'tr' ? 'İndirme başarılı!' : 'Download successful!', 
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
            
            spotifyUrlInput.value = '';
            hideOptionsPanel();
        } else {
            throw new Error(data.message || 'Download failed');
        }

    } catch (error) {
        console.error('Download error:', error);
        showNotification(
            error.message || (currentLang === 'tr' ? 'İndirme başarısız!' : 'Download failed!'), 
            'error'
        );
    } finally {
        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fas fa-download"></i> İndir';
    }
}

// Initialize backend connection check
document.addEventListener('DOMContentLoaded', async function() {
    const isBackendHealthy = await checkBackendHealth();
    
    if (!isBackendHealthy) {
        showNotification(
            currentLang === 'tr' ? 
            'Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.' : 
            'Could not connect to server. Please try again later.',
            'error'
        );
        
        // Disable download button
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + 
            (currentLang === 'tr' ? 'Sunucu Offline' : 'Server Offline');
    }
});