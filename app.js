document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const skeleton = document.getElementById('loading-skeleton');
    const viewerContainer = document.getElementById('menu-viewer-container');
    const menuImg = document.getElementById('menu-img');
    const canvas = document.getElementById('canvas');
    const viewport = document.getElementById('viewport');
    
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    
    const btnShareMenu = document.getElementById('btn-share-menu');
    const btnOpenQr = document.getElementById('btn-open-qr');
    const btnCloseQr = document.getElementById('btn-close-qr');
    const qrModal = document.getElementById('qr-modal');
    const btnDownloadQr = document.getElementById('btn-download-qr');
    const qrCodeContainer = document.getElementById('qrcode-container');

    // State Variables
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    // Touch specific state
    let tpCache = [];
    let initialTouchDist = null;
    let initialScale = 1;
    let lastTapTime = 0;

    // 1. Loading Skeleton Toggle
    function hideSkeleton() {
        skeleton.style.display = 'none';
        viewerContainer.style.display = 'block';
        resetZoom();
    }

    if (menuImg.complete) {
        hideSkeleton();
    } else {
        menuImg.addEventListener('load', hideSkeleton);
    }

    // 2. Zoom & Pan Transform Function
    function applyTransform(animate = false) {
        if (animate) {
            canvas.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            canvas.style.transition = 'transform 0.05s ease-out';
        }
        
        // Boundaries checks to avoid panning too far out
        const maxPanX = viewport.clientWidth * (scale - 1) / 2;
        const maxPanY = viewport.clientHeight * (scale - 1) / 2;
        
        if (scale === 1) {
            panX = 0;
            panY = 0;
        } else {
            panX = Math.max(-maxPanX * 1.5, Math.min(maxPanX * 1.5, panX));
            panY = Math.max(-maxPanY * 1.5, Math.min(maxPanY * 1.5, panY));
        }

        canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    // Helper zoom functions
    function zoomIn() {
        scale = Math.min(4, scale * 1.3);
        applyTransform(true);
    }

    function zoomOut() {
        scale = Math.max(1, scale / 1.3);
        applyTransform(true);
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        applyTransform(true);
    }

    // Event listeners for controls
    btnZoomIn.addEventListener('click', zoomIn);
    btnZoomOut.addEventListener('click', zoomOut);
    btnZoomReset.addEventListener('click', resetZoom);
    
    btnFullscreen.addEventListener('click', () => {
        viewerContainer.classList.toggle('fullscreen');
        const icon = btnFullscreen.querySelector('i');
        if (viewerContainer.classList.contains('fullscreen')) {
            icon.classList.replace('fa-maximize', 'fa-minimize');
        } else {
            icon.classList.replace('fa-minimize', 'fa-maximize');
        }
        resetZoom();
    });

    // 3. Mouse Event Handlers (Desktop Dragging)
    viewport.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (scale === 1) return; // Only pan when zoomed in
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransform(false);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    viewport.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    // 4. Touch Event Handlers (Mobile Dragging, Pinch-to-zoom, Double-tap)
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Handle Panning Start or Double-Tap
            const now = new Date().getTime();
            const timeDiff = now - lastTapTime;
            
            if (timeDiff < 300 && timeDiff > 0) {
                // Double tap zoom toggle
                if (scale > 1) {
                    resetZoom();
                } else {
                    scale = 2.5;
                    // Center the zoom on tap location if possible
                    const rect = viewport.getBoundingClientRect();
                    const tapX = e.touches[0].clientX - rect.left;
                    const tapY = e.touches[0].clientY - rect.top;
                    panX = (viewport.clientWidth / 2 - tapX) * 1.5;
                    panY = (viewport.clientHeight / 2 - tapY) * 1.5;
                    applyTransform(true);
                }
                e.preventDefault();
            } else {
                // Regular Pan start
                isDragging = true;
                startX = e.touches[0].clientX - panX;
                startY = e.touches[0].clientY - panY;
            }
            lastTapTime = now;
        } else if (e.touches.length === 2) {
            // Pinch-to-zoom Start
            isDragging = false;
            initialTouchDist = getTouchDistance(e.touches);
            initialScale = scale;
        }
    });

    viewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging) {
            // Single finger panning
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            applyTransform(false);
            e.preventDefault(); // Prevent body scrolling
        } else if (e.touches.length === 2 && initialTouchDist !== null) {
            // Two-finger pinch-zooming
            const currentDist = getTouchDistance(e.touches);
            const zoomFactor = currentDist / initialTouchDist;
            scale = Math.max(1, Math.min(4, initialScale * zoomFactor));
            applyTransform(false);
            e.preventDefault();
        }
    });

    viewport.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialTouchDist = null;
        }
        if (e.touches.length === 0) {
            isDragging = false;
        }
    });

    function getTouchDistance(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    // 5. Dynamic QR Code Generation
    // Fallback deployment URL on GitHub Pages
    const githubPagesUrl = 'https://mauriciosj06.github.io/menu-elmezxa/';
    const currentUrl = window.location.hostname === 'localhost' || window.location.protocol === 'file:' 
        ? githubPagesUrl 
        : window.location.href;

    // Generate QR using the library
    let qrcodeInstance = null;
    try {
        if (typeof QRCode !== 'undefined') {
            qrcodeInstance = new QRCode(qrCodeContainer, {
                text: currentUrl,
                width: 200,
                height: 200,
                colorDark: '#0e0e12',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrCodeContainer.innerText = 'Error al cargar la librería de QR.';
        }
    } catch (err) {
        console.error('QR code generation failed:', err);
    }

    // QR Modal controls
    btnOpenQr.addEventListener('click', () => {
        qrModal.classList.add('open');
    });

    btnCloseQr.addEventListener('click', () => {
        qrModal.classList.remove('open');
    });

    // Close modal when clicking backdrop
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
            qrModal.classList.remove('open');
        }
    });

    // QR Code Downloader
    btnDownloadQr.addEventListener('click', () => {
        // Try finding canvas or image inside container
        const qrCanvas = qrCodeContainer.querySelector('canvas');
        const qrImg = qrCodeContainer.querySelector('img');
        
        let dataUrl = '';
        if (qrCanvas) {
            dataUrl = qrCanvas.toDataURL('image/png');
        } else if (qrImg) {
            dataUrl = qrImg.src;
        }

        if (dataUrl) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'codigo-qr-menu-el-mezxa.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No se pudo generar la descarga del QR. Intenta tomar una captura de pantalla.');
        }
    });

    // 6. Web Share API & Copy Clipboard Fallback
    btnShareMenu.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Menú Digital | El Mezxa',
                    text: '¡Mira el menú digital de El Mezxa!',
                    url: currentUrl,
                });
            } catch (err) {
                console.log('Share canceled or failed', err);
            }
        } else {
            // Copy fallback
            try {
                await navigator.clipboard.writeText(currentUrl);
                
                // Show standard custom toast notification
                const toast = document.createElement('div');
                toast.innerText = 'Enlace copiado al portapapeles 📋';
                toast.style.position = 'fixed';
                toast.style.bottom = '100px';
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.background = 'rgba(228, 0, 124, 0.9)'; // Pink brand accent
                toast.style.color = '#fff';
                toast.style.padding = '12px 24px';
                toast.style.borderRadius = '25px';
                toast.style.fontSize = '0.9rem';
                toast.style.fontWeight = '600';
                toast.style.zIndex = '1000';
                toast.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                toast.style.transition = 'opacity 0.3s ease';
                
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => document.body.removeChild(toast), 300);
                }, 2000);
            } catch (err) {
                alert('Enlace del menú: ' + currentUrl);
            }
        }
    });
});
