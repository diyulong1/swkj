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
        
        // 构建操作按钮
        let actionButtons = `
            <button class="btn-primary" onclick="documentDetailView.downloadDocument()">
                <i class="fas fa-download"></i> 下载文档
            </button>
        `;
        
        // 为生物七年级上册期末试卷添加答案按钮
        if (this.document.name === '生物七年级上册期末试卷.docx') {
            actionButtons += `
                <button class="btn-primary" onclick="documentDetailView.showAnswers()">
                    <i class="fas fa-check-circle"></i> 查看答案
                </button>
            `;
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
                    ${actionButtons}
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
            // PDF直接打开到域名/kj/pdf文件
            window.location.href = window.location.origin + '/' + this.document.filePath;
        } else {
            viewerContent.innerHTML = `
                <div class="viewer-container">
                    <p>不支持的文件类型</p>
                    <p><a href="/${this.document.filePath}" target="_blank">点击下载文件</a></p>
                </div>
            `;
        }
    }
    
    // 显示答案
    showAnswers() {
        // 创建答案弹窗
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            display: block;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        `;
        
        // 弹窗内容
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 80%;
            max-width: 1000px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
        `;
        
        // 关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            color: #aaa;
            position: absolute;
            top: 10px;
            right: 20px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10;
        `;
        
        // 打开按钮
        const openBtn = document.createElement('span');
        openBtn.className = 'open';
        openBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
        openBtn.style.cssText = `
            color: #aaa;
            position: absolute;
            top: 15px;
            right: 60px;
            font-size: 20px;
            cursor: pointer;
            z-index: 10;
        `;
        openBtn.title = '在新标签页打开';
        
        // 打开按钮点击事件
        openBtn.addEventListener('click', () => {
            // 创建一个新的HTML文件内容，包含所有答案图片
            let answersHtml = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>试卷答案</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            background-color: #f5f5f5;
                        }
                        .container {
                            max-width: 1000px;
                            margin: 0 auto;
                            background-color: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        h1 {
                            text-align: center;
                            color: #333;
                        }
                        .answer-item {
                            margin-bottom: 30px;
                            text-align: center;
                        }
                        .answer-item {
                            overflow: auto;
                            touch-action: pan-x pan-y;
                            -webkit-overflow-scrolling: touch;
                        }
                        .answer-item img {
                            max-width: 100%;
                            height: auto;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            transition: transform 0.2s ease;
                        }
                        .answer-item p {
                            margin-top: 10px;
                            font-weight: bold;
                            color: #666;
                        }
                    </style>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                </head>
                <body>
                    <div class="container">
                        <h1>试卷答案</h1>
            `;
            
            // 添加所有答案图片
            for (let i = 1; i <= 29; i++) {
                if (i <= 28) {
                    // 1-28有答案图片
                    answersHtml += `
                        <div class="answer-item">
                            <img src="/答案/${i}.jpg" alt="答案 ${i}">
                            <p>答案 ${i}</p>
                        </div>
                    `;
                } else {
                    // 29没有答案
                    answersHtml += `
                        <div class="answer-item">
                            <p style="color: #999; font-style: italic;">无答案</p>
                            <p>答案 ${i}</p>
                        </div>
                    `;
                }
            }
            
            answersHtml += `
                    </div>
                    <script>
                        // 为所有答案图片添加双指缩放功能
                        document.querySelectorAll('.answer-item').forEach(wrapper => {
                            const img = wrapper.querySelector('img');
                            if (img) {
                                let scale = 1;
                                let lastDistance = 0;
                                
                                wrapper.addEventListener('touchstart', (e) => {
                                    if (e.touches.length === 2) {
                                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                                        lastDistance = Math.sqrt(dx * dx + dy * dy);
                                    }
                                });
                                
                                wrapper.addEventListener('touchmove', (e) => {
                                    if (e.touches.length === 2) {
                                        e.preventDefault();
                                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                                        const distance = Math.sqrt(dx * dx + dy * dy);
                                        
                                        if (lastDistance > 0) {
                                            const scaleFactor = distance / lastDistance;
                                            scale *= scaleFactor;
                                            // 限制缩放范围
                                            scale = Math.max(0.5, Math.min(3, scale));
                                            img.style.transform = 'scale(' + scale + ')';

                                        }
                                        
                                        lastDistance = distance;
                                    }
                                });
                                
                                wrapper.addEventListener('touchend', () => {
                                    lastDistance = 0;
                                });
                            }
                        });
                    </script>
                </body>
                </html>
            `;
            
            // 创建一个Blob对象
            const blob = new Blob([answersHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // 在新标签页中打开
            window.open(url, '_blank');
        });
        
        // 答案标题
        const title = document.createElement('h2');
        title.textContent = '试卷答案';
        title.style.cssText = 'margin-top: 0;';
        
        // 答案图片容器
        const answersContainer = document.createElement('div');
        answersContainer.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';
        
        // 加载答案图片（1-28.jpg有答案，29没有）
        for (let i = 1; i <= 29; i++) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'text-align: center;';
            
            const caption = document.createElement('p');
            caption.textContent = `答案 ${i}`;
            caption.style.cssText = 'margin-top: 10px; font-weight: bold;';
            
            if (i <= 28) {
                // 1-28有答案图片
                const imgWrapper = document.createElement('div');
                imgWrapper.style.cssText = 'overflow: auto; touch-action: pan-x pan-y; -webkit-overflow-scrolling: touch;';
                
                const img = document.createElement('img');
                img.src = `/答案/${i}.jpg`;
                img.alt = `答案 ${i}`;
                img.style.cssText = 'max-width: 100%; height: auto; transition: transform 0.2s ease;';
                
                // 添加缩放和拖动功能
                let scale = 1;
                let lastDistance = 0;
                let isDragging = false;
                let startX = 0;
                let startY = 0;
                let translateX = 0;
                let translateY = 0;
                
                imgWrapper.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        // 双指缩放
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        lastDistance = Math.sqrt(dx * dx + dy * dy);
                    } else if (e.touches.length === 1) {
                        // 单指拖动
                        isDragging = true;
                        startX = e.touches[0].clientX - translateX;
                        startY = e.touches[0].clientY - translateY;
                    }
                });
                
                imgWrapper.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 2) {
                        // 双指缩放
                        e.preventDefault();
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (lastDistance > 0) {
                            const scaleFactor = distance / lastDistance;
                            scale *= scaleFactor;
                            // 限制缩放范围
                            scale = Math.max(0.5, Math.min(3, scale));
                        }
                        
                        lastDistance = distance;
                    } else if (e.touches.length === 1 && isDragging) {
                        // 单指拖动
                        e.preventDefault();
                        translateX = e.touches[0].clientX - startX;
                        translateY = e.touches[0].clientY - startY;
                    }
                    
                    // 更新图片位置和缩放
                    img.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
                });
                
                imgWrapper.addEventListener('touchend', () => {
                    lastDistance = 0;
                    isDragging = false;
                });
                
                imgWrapper.appendChild(img);
                imgContainer.appendChild(imgWrapper);
            } else {
                // 29没有答案
                const noAnswer = document.createElement('p');
                noAnswer.textContent = '无答案';
                noAnswer.style.cssText = 'color: #999; font-style: italic;';
                imgContainer.appendChild(noAnswer);
            }
            
            imgContainer.appendChild(caption);
            answersContainer.appendChild(imgContainer);
        }
        
        // 设置按钮
        const settingsBtn = document.createElement('span');
        settingsBtn.className = 'settings';
        settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
        settingsBtn.style.cssText = `
            color: #aaa;
            position: absolute;
            top: 15px;
            right: 100px;
            font-size: 20px;
            cursor: pointer;
            z-index: 10;
        `;
        settingsBtn.title = '设置';
        
        // 设置弹窗
        settingsBtn.addEventListener('click', () => {
            const settingsModal = document.createElement('div');
            settingsModal.className = 'modal';
            settingsModal.style.cssText = `
                display: block;
                position: fixed;
                z-index: 2000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.4);
            `;
            
            const settingsContent = document.createElement('div');
            settingsContent.className = 'modal-content';
            settingsContent.style.cssText = `
                background-color: #fefefe;
                margin: 20% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 80%;
                max-width: 500px;
                position: relative;
            `;
            
            const settingsCloseBtn = document.createElement('span');
            settingsCloseBtn.className = 'close';
            settingsCloseBtn.innerHTML = '&times;';
            settingsCloseBtn.style.cssText = `
                color: #aaa;
                position: absolute;
                top: 10px;
                right: 20px;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            `;
            
            const settingsTitle = document.createElement('h3');
            settingsTitle.textContent = '显示设置';
            settingsTitle.style.cssText = 'margin-top: 0;';
            
            const displayOption = document.createElement('div');
            displayOption.style.cssText = 'margin: 20px 0;';
            
            const displayLabel = document.createElement('p');
            displayLabel.textContent = '图片显示位置:';
            displayLabel.style.cssText = 'margin-bottom: 10px; font-weight: bold;';
            
            const displaySelect = document.createElement('select');
            displaySelect.style.cssText = 'width: 100%; padding: 10px; font-size: 16px;';
            
            const option1 = document.createElement('option');
            option1.value = 'modal';
            option1.textContent = '弹窗内显示';
            
            const option2 = document.createElement('option');
            option2.value = 'fullscreen';
            option2.textContent = '网页顶部显示';
            
            displaySelect.appendChild(option1);
            displaySelect.appendChild(option2);
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '保存设置';
            saveBtn.style.cssText = `
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
            `;
            
            saveBtn.addEventListener('click', () => {
                const displayMode = displaySelect.value;
                if (displayMode === 'fullscreen') {
                    // 在网页顶部显示答案图片
                    showAnswersFullscreen();
                }
                document.body.removeChild(settingsModal);
            });
            
            displayOption.appendChild(displayLabel);
            displayOption.appendChild(displaySelect);
            
            settingsContent.appendChild(settingsCloseBtn);
            settingsContent.appendChild(settingsTitle);
            settingsContent.appendChild(displayOption);
            settingsContent.appendChild(saveBtn);
            settingsModal.appendChild(settingsContent);
            document.body.appendChild(settingsModal);
            
            settingsCloseBtn.addEventListener('click', () => {
                document.body.removeChild(settingsModal);
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    document.body.removeChild(settingsModal);
                }
            });
        });
        
        // 在网页顶部全屏显示答案
        function showAnswersFullscreen() {
            // 创建全屏容器
            const fullscreenContainer = document.createElement('div');
            fullscreenContainer.id = 'answersFullscreen';
            fullscreenContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: white;
                z-index: 3000;
                overflow-y: auto;
                padding: 20px;
            `;
            
            // 关闭按钮
            const fullscreenCloseBtn = document.createElement('button');
            fullscreenCloseBtn.textContent = '关闭';
            fullscreenCloseBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f44336;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                z-index: 3001;
            `;
            
            // 标题
            const fullscreenTitle = document.createElement('h1');
            fullscreenTitle.textContent = '试卷答案';
            fullscreenTitle.style.cssText = 'text-align: center; margin-bottom: 30px;';
            
            // 答案容器
            const fullscreenAnswers = document.createElement('div');
            fullscreenAnswers.style.cssText = 'max-width: 1000px; margin: 0 auto;';
            
            // 添加所有答案图片
            for (let i = 1; i <= 29; i++) {
                const answerItem = document.createElement('div');
                answerItem.style.cssText = 'margin-bottom: 40px; text-align: center;';
                
                if (i <= 28) {
                    const img = document.createElement('img');
                    img.src = `/答案/${i}.jpg`;
                    img.alt = `答案 ${i}`;
                    img.style.cssText = 'max-width: 100%; height: auto; transition: transform 0.2s ease;';
                    
                    // 添加缩放和拖动功能
                    let scale = 1;
                    let lastDistance = 0;
                    let isDragging = false;
                    let startX = 0;
                    let startY = 0;
                    let translateX = 0;
                    let translateY = 0;
                    
                    answerItem.addEventListener('touchstart', (e) => {
                        if (e.touches.length === 2) {
                            // 双指缩放
                            const dx = e.touches[0].clientX - e.touches[1].clientX;
                            const dy = e.touches[0].clientY - e.touches[1].clientY;
                            lastDistance = Math.sqrt(dx * dx + dy * dy);
                        } else if (e.touches.length === 1) {
                            // 单指拖动
                            isDragging = true;
                            startX = e.touches[0].clientX - translateX;
                            startY = e.touches[0].clientY - translateY;
                        }
                    });
                    
                    answerItem.addEventListener('touchmove', (e) => {
                        if (e.touches.length === 2) {
                            // 双指缩放
                            e.preventDefault();
                            const dx = e.touches[0].clientX - e.touches[1].clientX;
                            const dy = e.touches[0].clientY - e.touches[1].clientY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (lastDistance > 0) {
                                const scaleFactor = distance / lastDistance;
                                scale *= scaleFactor;
                                // 限制缩放范围
                                scale = Math.max(0.5, Math.min(3, scale));
                            }
                            
                            lastDistance = distance;
                        } else if (e.touches.length === 1 && isDragging) {
                            // 单指拖动
                            e.preventDefault();
                            translateX = e.touches[0].clientX - startX;
                            translateY = e.touches[0].clientY - startY;
                        }
                        
                        // 更新图片位置和缩放
                        img.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
                    });
                    
                    answerItem.addEventListener('touchend', () => {
                        lastDistance = 0;
                        isDragging = false;
                    });
                    
                    answerItem.appendChild(img);
                } else {
                    const noAnswer = document.createElement('p');
                    noAnswer.textContent = '无答案';
                    noAnswer.style.cssText = 'color: #999; font-style: italic; font-size: 18px;';
                    answerItem.appendChild(noAnswer);
                }
                
                const caption = document.createElement('p');
                caption.textContent = `答案 ${i}`;
                caption.style.cssText = 'margin-top: 10px; font-weight: bold; font-size: 18px;';
                answerItem.appendChild(caption);
                
                fullscreenAnswers.appendChild(answerItem);
            }
            
            fullscreenCloseBtn.addEventListener('click', () => {
                document.body.removeChild(fullscreenContainer);
                document.body.removeChild(fullscreenCloseBtn);
            });
            
            fullscreenContainer.appendChild(fullscreenTitle);
            fullscreenContainer.appendChild(fullscreenAnswers);
            document.body.appendChild(fullscreenContainer);
            document.body.appendChild(fullscreenCloseBtn);
        }
        
        // 组装弹窗
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(openBtn);
        modalContent.appendChild(settingsBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(answersContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 关闭弹窗事件
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 点击弹窗外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
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