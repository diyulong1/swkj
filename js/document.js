class DocumentDetailView {
    constructor() {
        this.document = null;
        this.init();
    }

    async init() {
        // 从URL参数获取文档ID
        const urlParams = new URLSearchParams(window.location.search);
        const docId = urlParams.get('id');
        
        if (docId) {
            await this.loadDocument(docId);
        } else {
            this.showError('未指定文档ID');
        }
    }

    async loadDocument(id) {
        try {
            const response = await fetch('/js/documents.json');
            if (!response.ok) throw new Error('Failed to load documents');
            
            const documents = await response.json();
            // 使用相同的ID生成方式查找文档
            this.document = documents.find(doc => doc.id === id);
            
            if (this.document) {
                this.renderDocument();
            } else {
                this.showError('未找到指定的文档');
            }
        } catch (error) {
            console.error('Error loading document:', error);
            this.showError('加载文档失败，请稍后重试');
        }
    }

    renderDocument() {
        const container = document.getElementById('documentDetailContainer');
        
        if (!this.document) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>文档不存在</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="document-detail-card">
                <div class="document-header">
                    <div class="document-icon ${this.document.type}">
                        <i class="fas ${this.getDocumentIcon(this.document.type)}"></i>
                    </div>
                    <div class="document-info">
                        <h2>${this.document.name}</h2>
                        <p>文件大小: ${this.formatFileSize(this.document.size)}</p>
                        <p>上传时间: ${this.formatDate(this.document.uploadDate)}</p>
                    </div>
                </div>
                
                <div class="document-viewer">
                    <div id="viewerContent"></div>
                </div>
                
                <div class="document-actions">
                    <button class="btn-primary" onclick="documentDetailView.downloadDocument()">
                        <i class="fas fa-download"></i> 下载文档
                    </button>
                </div>
            </div>
        `;
        
        // 加载文档预览
        this.loadDocumentPreview();
        
        // 添加全屏按钮事件监听器
        setTimeout(() => {
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => {
                    this.toggleFullscreen();
                });
            }
        }, 100);
    }

    loadDocumentPreview() {
        const viewerContent = document.getElementById('viewerContent');
        
        if (!this.document) return;
        
        // 根据文件类型显示不同的查看器
        if (this.document.type === 'ppt') {
            // PPT优化：添加wdSlideId和wdArrows=true参数，提高清晰度
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + '/' + this.document.filePath)}&amp;wdArrows=true&amp;wdScroll=true&amp;wdEmbedCodeType=OfficeOnline"></iframe>
                </div>
            `;
        } else if (this.document.type === 'word') {
            // Word优化：添加wdScroll=true参数，提高清晰度
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + '/' + this.document.filePath)}&amp;wdScroll=true&amp;wdEmbedCodeType=OfficeOnline"></iframe>
                </div>
            `;
        } else if (this.document.type === 'excel') {
            // Excel优化：添加wdInConfigurator=true和wdScroll=true参数，提高清晰度
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + '/' + this.document.filePath)}&amp;wdInConfigurator=true&amp;wdScroll=true&amp;wdEmbedCodeType=OfficeOnline"></iframe>
                </div>
            `;
        } else if (this.document.type === 'pdf') {
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <iframe id="pdfViewer" src="${window.location.origin}/${this.document.filePath}" allowfullscreen></iframe>
                    <div class="viewer-controls">
                    <button class="btn-secondary" id="fullscreenBtn">
                        <i class="fas fa-expand"></i> 全屏查看
                    </button>
                </div>
                </div>
            `;
        } else {
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <p>不支持的文件类型</p>
                    <p><a href="/${this.document.filePath}" target="_blank">点击下载文件</a></p>
                </div>
            `;
        }
    }

    // 获取文档图标
    getDocumentIcon(type) {
        switch (type) {
            case 'ppt': return 'fa-file-powerpoint';
            case 'word': return 'fa-file-word';
            case 'excel': return 'fa-file-excel';
            case 'pdf': return 'fa-file-pdf';
            default: return 'fa-file';
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    // 下载文档
    downloadDocument() {
        if (this.document) {
            const link = document.createElement('a');
            link.href = `/${this.document.filePath}`;
            link.download = this.document.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 切换全屏模式
    toggleFullscreen() {
        const iframe = document.getElementById('pdfViewer');
        if (!iframe) return;
        
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) { // Safari
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) { // IE11
            iframe.msRequestFullscreen();
        }
    }

    showError(message) {
        const container = document.getElementById('documentDetailContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <a href="/" class="btn-primary">返回首页</a>
            </div>
        `;
    }
}

// 初始化文档详情视图
const documentDetailView = new DocumentDetailView();