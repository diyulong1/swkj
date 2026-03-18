// 文档查看器主脚本
class DocumentViewer {
    constructor() {
        this.documents = [];
        this.filteredDocuments = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadDocuments();
        this.bindEvents();
    }

    // 绑定事件监听器
    bindEvents() {
        // 筛选按钮事件
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterDocuments();
            });
        });
        
        // 模态框关闭事件
        const modal = document.getElementById('viewerModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.getElementById('viewerContent').innerHTML = '';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.getElementById('viewerContent').innerHTML = '';
            }
        });
    }

    // 加载文档列表
    async loadDocuments() {
        try {
            const response = await fetch('/js/documents.json');
            if (!response.ok) throw new Error('Failed to load documents');
            
            this.documents = await response.json();
            this.filteredDocuments = [...this.documents];
            this.renderDocuments();
        } catch (error) {
            console.error('Error loading documents:', error);
            document.getElementById('documentsContainer').innerHTML = 
                '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>加载文档失败，请稍后重试</p></div>';
        }
    }

    // 筛选文档
    filterDocuments() {
        if (this.currentFilter === 'all') {
            this.filteredDocuments = [...this.documents];
        } else {
            this.filteredDocuments = this.documents.filter(doc => doc.type === this.currentFilter);
        }
        this.renderDocuments();
    }

    // 渲染文档列表
    renderDocuments() {
        const container = document.getElementById('documentsContainer');
        
        if (this.filteredDocuments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>暂无文档</p></div>';
            return;
        }
        
        container.innerHTML = this.filteredDocuments.map(doc => {
            // 根据文档类型决定点击事件
            const onClickAction = `window.location.href='/document.html?id=${doc.id}'`;
            
            return `
                <div class="document-card" data-id="${doc.id}" onclick="${onClickAction}">
                    <div class="document-icon ${doc.type}">
                        <i class="fas ${this.getDocumentIcon(doc.type)}"></i>
                    </div>
                    <div class="document-info">
                        <h3 title="${doc.name}">${doc.name}</h3>
                        <p>${this.formatFileSize(doc.size)}</p>
                        <p>${this.formatDate(doc.uploadDate)}</p>
                        <div class="document-actions">
                            <button class="action-btn view-btn">
                                <i class="fas fa-ellipsis-h"></i> 更多查看
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
}

// 初始化文档查看器
const viewer = new DocumentViewer();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 页面加载完成后的其他初始化代码可以放在这里
});