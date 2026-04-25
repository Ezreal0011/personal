/**
 * 游戏资源流向蓝图工具 - 主应用
 */
// ==================== 全局对象 ====================
const App = {
    currentTheme: 'light',
    
    /**
     * 初始化应用
     */
    init() {
        DataStore.init();
        
        // 恢复主题设置
        const savedTheme = localStorage.getItem('blueprint-theme') || 'light';
        this.setTheme(savedTheme, false);
        
        this.showPage('home');
        this.renderProjectList();
        
        // 初始化画布
        Canvas.init();
    },

    /**
     * 显示指定页面
     */
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(`page-${pageName}`);
        if (page) page.classList.add('active');
    },

    /**
     * 返回首页
     */
    goHome() {
        this.showPage('home');
        this.renderProjectList();
        DataStore.currentProjectId = null;
    },

    /**
     * 进入编辑器
     */
    openEditor(projectId) {
        DataStore.setCurrentProject(projectId);
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        // 更新标题栏
        document.getElementById('current-project-name').textContent = project.name;
        document.getElementById('current-project-version').textContent = `v${project.version}`;
        
        this.showPage('editor');
        
        // 重置视图并渲染
        Canvas.resetView();
        Canvas.render(project);
        
        // 渲染左侧面板
        LeftPanel.renderSystemTree();
        LeftPanel.renderResourceList();
        LeftPanel.renderResourceTypeList();
        
        // 显示默认属性面板
        PropertyPanel.showDefault();
    },

    /**
     * 新建项目
     */
    createNewProject() {
        Modal.open('project', { mode: 'create' });
    },

    /**
     * 搜索项目
     */
    searchProjects(query) {
        const projects = DataStore.searchProjects(query);
        this.renderProjectList(projects);
    },

    /**
     * 渲染项目列表
     */
    renderProjectList(projects) {
        const list = document.getElementById('project-list');
        projects = projects || DataStore.getProjects();
        
        if (projects.length === 0) {
            list.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-light);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>还没有项目</p>
                    <p style="font-size: 13px; margin-top: 8px;">点击"新建项目"开始创建你的第一个蓝图</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = projects.map(p => `
            <div class="project-card" onclick="App.openEditor('${p.id}')">
                <div class="project-card-header">
                    <div class="project-card-title">
                        <i class="fas fa-project-diagram"></i>
                        ${this.escapeHtml(p.name)}
                    </div>
                </div>
                <div class="project-card-meta">
                    <span><i class="fas fa-code-branch"></i> v${p.version}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(p.updatedAt)}</span>
                </div>
                <div class="project-card-meta">
                    <span><i class="fas fa-cubes"></i> ${p.nodes?.length || 0} 节点</span>
                    <span><i class="fas fa-link"></i> ${p.edges?.length || 0} 关系</span>
                </div>
                <div class="project-card-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-sm btn-primary" onclick="App.openEditor('${p.id}')">进入编辑</button>
                    <button class="btn btn-sm" onclick="App.duplicate('${p.id}')">复制</button>
                    <button class="btn btn-sm" onclick="App.delete('${p.id}')">删除</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * 复制项目
     */
    duplicate(id) {
        const copy = DataStore.duplicateProject(id);
        if (copy) {
            Toast.show(`已复制为 "${copy.name}"`, 'success');
            this.renderProjectList();
        }
    },

    /**
     * 删除项目
     */
    delete(id) {
        const project = DataStore.getProject(id);
        if (!project) return;
        
        if (confirm(`确定要删除项目"${project.name}"吗？此操作不可撤销。`)) {
            DataStore.deleteProject(id);
            Toast.show('项目已删除', 'success');
            this.renderProjectList();
        }
    },

    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, true);
    },
    
    /**
     * 设置主题
     */
    setTheme(theme, save = true) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新图标
        const icon = document.getElementById('theme-icon');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            icon.parentElement.title = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
        }
        
        if (save) {
            localStorage.setItem('blueprint-theme', theme);
        }
        
        Toast.show(`已切换到${theme === 'dark' ? '深色' : '浅色'}模式`, 'info');
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
};

// ==================== 编辑器模块 ====================
const Editor = {
    currentView: 'system',
    
    /**
     * 切换视图模式
     */
    toggleView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.toolbar-center .btn-toggle[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 可以在这里添加不同视图的渲染逻辑
        Canvas.refresh();
    },

    /**
     * 切换筛选面板
     */
    toggleFilter() {
        const panel = document.getElementById('filter-panel');
        panel.classList.toggle('hidden');
    },
    
    filterByType(type, checked) {
        if (type === 'system') Canvas.filters.showSystemNodes = checked;
        if (type === 'resource') Canvas.filters.showResourceNodes = checked;
        Canvas.refresh();
    },
    
    filterByRelation(type, checked) {
        if (type === 'output') Canvas.filters.showOutputEdges = checked;
        if (type === 'consume') Canvas.filters.showConsumeEdges = checked;
        Canvas.refresh();
    },

    /**
     * 搜索节点
     */
    searchNodes(query) {
        Canvas.filters.searchQuery = query;
        Canvas.refresh();
    },

    /**
     * 保存项目
     */
    saveProject() {
        DataStore.save();
        Toast.show('项目已保存', 'success');
    },

    /**
     * 云同步 - 通过URL分享
     */
    cloudSync() {
        const project = DataStore.getCurrentProject();
        if (!project) {
            Toast.show('请先打开一个项目', 'warning');
            return;
        }
        
        // 检查URL参数是否有分享数据
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');
        
        if (sharedData) {
            try {
                const decoded = JSON.parse(decodeURIComponent(sharedData));
                if (confirm(`发现分享的项目 "${decoded.name}"，是否加载？`)) {
                    const currentProject = DataStore.getCurrentProject();
                    Object.assign(currentProject, {
                        nodes: decoded.nodes || [],
                        edges: decoded.edges || [],
                        customSubTypes: decoded.customSubTypes || [],
                        customResourceTypes: decoded.customResourceTypes || []
                    });
                    DataStore.save();
                    Canvas.refresh();
                    LeftPanel.renderSystemTree();
                    LeftPanel.renderResourceList();
                    LeftPanel.renderResourceTypeList();
                    Toast.show('已加载分享的项目', 'success');
                    // 清除URL参数
                    window.history.replaceState({}, '', window.location.pathname);
                }
            } catch (e) {
                Toast.show('分享链接无效', 'error');
            }
            return;
        }
        
        // 生成分享链接
        const shareData = {
            name: project.name,
            version: project.version,
            nodes: project.nodes,
            edges: project.edges,
            customSubTypes: project.customSubTypes,
            customResourceTypes: project.customResourceTypes
        };
        const encoded = encodeURIComponent(JSON.stringify(shareData));
        const shareUrl = window.location.origin + window.location.pathname + '?data=' + encoded;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(shareUrl).then(() => {
            Toast.show('分享链接已复制到剪贴板，发给其他人打开即可', 'success');
        }).catch(() => {
            prompt('分享链接：', shareUrl);
        });
    },

    /**
     * 撤销
     */
    undo() {
        if (DataStore.undo()) {
            Canvas.refresh();
            LeftPanel.renderSystemTree();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show('已撤销', 'info');
        }
    },

    /**
     * 重做
     */
    redo() {
        if (DataStore.redo()) {
            Canvas.refresh();
            LeftPanel.renderSystemTree();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show('已重做', 'info');
        }
    },

    /**
     * 导出数据
     */
    exportData() {
        // 确保获取到项目ID
        let projectId = DataStore.currentProjectId;
        if (!projectId) {
            const project = DataStore.getCurrentProject();
            if (project) projectId = project.id;
        }
        
        const data = DataStore.exportData(projectId);
        if (!data) {
            Toast.show('导出失败：未找到项目', 'error');
            return;
        }
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${DataStore.getCurrentProject()?.name || 'blueprint'}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        Toast.show('导出成功', 'success');
    },

    /**
     * 打开分析页面
     */
    openAnalysis() {
        Analysis.init();
        App.showPage('analysis');
    }
};

// ==================== 左侧面板模块 ====================
const LeftPanel = {
    activeTab: 'tree',
    resourceFilter: 'all',

    switchTab(tab) {
        this.activeTab = tab;
        
        document.querySelectorAll('.panel-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('#tab-tree, #tab-resources').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });
    },

    addSystemNode() {
        Modal.open('system');
    },

    addResource() {
        Modal.open('resource');
    },

    renderSystemTree() {
        const container = document.getElementById('system-tree');
        const project = DataStore.getCurrentProject();
        if (!project) {
            console.warn('[LeftPanel] renderSystemTree: no current project');
            return;
        }
        
        const systemNodes = project.nodes.filter(n => n.type === 'system');
        const rootNodes = systemNodes.filter(n => !n.parentId);
        
        container.innerHTML = rootNodes.map(node => this.buildTreeNode(node, systemNodes)).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.tree-node-item').forEach(item => {
            item.addEventListener('click', () => {
                const nodeId = item.closest('.tree-node')?.dataset.nodeId;
                if (nodeId) {
                    Canvas.selectNode(nodeId);
                    this.focusNodeInCanvas(nodeId);
                    PropertyPanel.showNodeProperty(nodeId);
                }
            });
            
            // 右键菜单
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const nodeId = item.closest('.tree-node')?.dataset.nodeId;
                this.showTreeContextMenu(e, nodeId);
            });
        });
        
        // 拖拽排序：改变层级关系
        this.bindTreeDragDrop(container, systemNodes);
    },

    buildTreeNode(node, allNodes, depth = 0) {
        const children = allNodes.filter(n => n.parentId === node.id);
        const hasChildren = children.length > 0;
        
        // 获取根级颜色（根节点用自身颜色，子节点沿父链向上查找）
        let colorDot = '';
        const nodeColor = node.parentColor || this._findRootAncestorColor(node, allNodes);
        if (nodeColor) {
            colorDot = `<span class="tree-color-dot" style="background:${nodeColor}"></span>`;
        }
        
        let html = `
            <div class="tree-node" data-node-id="${node.id}">
                <div class="tree-node-item system" style="padding-left: ${10 + depth * 16}px" draggable="true" data-tree-id="${node.id}">
                    ${hasChildren ? `<span class="toggle-icon expanded" onclick="event.stopPropagation(); LeftPanel.toggleTreeNode(this)"><i class="fas fa-chevron-right"></i></span>` : '<span class="toggle-icon" style="visibility:hidden"><i class="fas fa-circle"></i></span>'}
                    <i class="tree-icon fas fa-cubes"></i>
                    ${colorDot}
                    <span class="tree-label">${this.escapeHtml(node.name)}</span>
                    <span class="tree-drag-handle" title="拖动调整层级"><i class="fas fa-grip-vertical"></i></span>
                </div>
                ${hasChildren ? `<div class="tree-children expanded">${children.map(c => this.buildTreeNode(c, allNodes, depth + 1)).join('')}</div>` : ''}
            </div>
        `;
        return html;
    },

    /** 沿着 parentId 向上找根级祖先的颜色 */
    _findRootAncestorColor(node, allNodes) {
        let currentId = node.parentId;
        while (currentId) {
            const parent = allNodes.find(n => n.id === currentId);
            if (!parent) break;
            if (parent.parentColor) return parent.parentColor;
            currentId = parent.parentId;
        }
        return null;
    },

    /**
     * 绑定树节点拖拽事件（改变父子层级）
     */
    bindTreeDragDrop(container, systemNodes) {
        let draggedNodeId = null;
        let dragGhostEl = null;

        container.querySelectorAll('.tree-node-item[draggable]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedNodeId = e.target.dataset.treeId;
                // 创建半透明跟随元素
                dragGhostEl = document.createElement('div');
                dragGhostEl.className = 'tree-drag-ghost';
                dragGhostEl.textContent = e.target.querySelector('.tree-label')?.textContent || '';
                dragGhostEl.style.position = 'fixed';
                dragGhostEl.style.left = e.clientX + 'px';
                dragGhostEl.style.top = e.clientY + 'px';
                dragGhostEl.style.zIndex = '99999';
                document.body.appendChild(dragGhostEl);
                
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedNodeId);
                setTimeout(() => e.target.classList.add('tree-dragging'), 0);
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('tree-dragging');
                if (dragGhostEl) { dragGhostEl.remove(); dragGhostEl = null; }
                draggedNodeId = null;
                container.querySelectorAll('.tree-drop-target').forEach(el => el.classList.remove('tree-drop-target'));
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const targetId = e.target.closest('.tree-node-item')?.dataset.treeId;
                if (targetId && targetId !== draggedNodeId) {
                    e.target.closest('.tree-node')?.classList.add('tree-drop-target');
                }
            });

            item.addEventListener('dragleave', (e) => {
                e.target.closest('.tree-node')?.classList.remove('tree-drop-target');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const targetId = e.target.closest('.tree-node-item')?.dataset.treeId;
                container.querySelectorAll('.tree-drop-target').forEach(el => el.classList.remove('tree-drop-target'));
                
                if (!targetId || !draggedNodeId || targetId === draggedNodeId) return;
                
                // 检查是否会形成循环引用（目标不能是源节点的后代）
                if (this.isDescendantOf(targetId, draggedNodeId, systemNodes)) {
                    Toast.show('不能将节点移动到自己的子级下', 'warning');
                    return;
                }
                
                // 更新 parentId
                DataStore.pushHistory();
                DataStore.updateNode(draggedNodeId, { parentId: targetId });
                
                Canvas.refresh();
                this.renderSystemTree();
                Toast.show('已调整层级关系', 'success');
            });
        });

        // 跟踪 ghost 位置
        document.addEventListener('mousemove', (e) => {
            if (dragGhostEl) {
                dragGhostEl.style.left = (e.clientX + 12) + 'px';
                dragGhostEl.style.top = (e.clientY + 12) + 'px';
            }
        }, true); // capture phase
    },

    /**
     * 检查 targetId 是否是 sourceId 的后代
     */
    isDescendantOf(potentialChildId, ancestorId, allNodes) {
        let current = potentialChildId;
        while (current) {
            if (current === ancestorId) return true;
            const parent = allNodes.find(n => n.id === current);
            current = parent?.parentId || null;
        }
        return false;
    },

    /**
     * 显示树节点右键菜单
     */
    showTreeContextMenu(e, nodeId) {
        this._treeContextNodeId = nodeId;
        const menu = document.getElementById('tree-context-menu');
        menu.classList.remove('hidden');
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        
        // 确保不超出屏幕
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = (e.clientX - rect.width) + 'px';
        if (rect.bottom > window.innerHeight) menu.style.top = (e.clientY - rect.height) + 'px';
    },

    /**
     * 隐藏树节点右键菜单
     */
    hideTreeContextMenu() {
        document.getElementById('tree-context-menu')?.classList.add('hidden');
        this._treeContextNodeId = null;
    },

    /**
     * 执行树节点右键菜单操作
     */
    treeContextAction(action) {
        const nodeId = this._treeContextNodeId;
        if (!nodeId) return;
        this.hideTreeContextMenu();
        
        switch (action) {
            case 'edit': {
                // 打开编辑模态框（预填充当前节点数据）
                const project = DataStore.getCurrentProject();
                const node = project?.nodes.find(n => n.id === nodeId);
                if (!node) return;
                Modal.open('system-edit', { nodeId: node.id });
                break;
            }
            case 'addChild': {
                // 预设父节点为当前节点，打开新建模态框
                Modal.open('system', { defaultParentId: nodeId });
                break;
            }
            case 'duplicate': {
                const project = DataStore.getCurrentProject();
                const src = project?.nodes.find(n => n.id === nodeId);
                if (!src) return;
                DataStore.addNode({
                    name: src.name + ' (副本)',
                    type: 'system',
                    parentId: src.parentId,
                    subType: src.subType,
                    level: src.level,
                    x: src.x + 30,
                    y: src.y + 30,
                    tags: [...(src.tags || [])],
                    description: src.description || ''
                });
                Canvas.refresh();
                this.renderSystemTree();
                this.renderResourceTypeList();
                Toast.show(`已复制 "${src.name}"`, 'success');
                break;
            }
            case 'delete': {
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === nodeId);
                if (node) {
                    // 同时删除所有子节点
                    const project = DataStore.getCurrentProject();
                    const descendantIds = [nodeId];
                    let queue = [nodeId];
                    while (queue.length > 0) {
                        const pid = queue.shift();
                        project.nodes.forEach(n => {
                            if (n.parentId === pid && !descendantIds.includes(n.id)) {
                                descendantIds.push(n.id);
                                queue.push(n.id);
                            }
                        });
                    }
                    const names = descendantIds.map(id => project.nodes.find(n => n.id === id)?.name).filter(Boolean);
                    const msg = `确定要删除「${node.name}」${descendantIds.length > 1 ? `及其 ${descendantIds.length - 1} 个子节点` : ''}吗？`;
                    if (confirm(msg)) {
                        DataStore.pushHistory();
                        descendantIds.forEach(id => {
                            project.nodes = project.nodes.filter(n => n.id !== id);
                            project.edges = project.edges.filter(e => e.source !== id && e.target !== id);
                        });
                        DataStore.save();
                        Canvas.refresh();
                        this.renderSystemTree();
                        this.renderResourceTypeList();
                        PropertyPanel.showDefault();
                        Toast.show(`已删除 ${descendantIds.length} 个系统节点`, 'success');
                    }
                }
                break;
            }
        }
    },

    toggleTreeNode(iconEl) {
        iconEl.classList.toggle('expanded');
        const treeChildren = iconEl.closest('.tree-node')?.querySelector('.tree-children');
        if (treeChildren) {
            treeChildren.classList.toggle('expanded');
        }
    },

    focusNodeInCanvas(nodeId) {
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // 只对非根级父节点做画布定位（根级父节点不移动）
        if (node.type === 'system' && !node.parentId) return;
        
        const canvasRect = Canvas.container.getBoundingClientRect();
        Canvas.offsetX = canvasRect.width / 2 - node.x * Canvas.scale - 70 * Canvas.scale;
        Canvas.offsetY = canvasRect.height / 2 - node.y * Canvas.scale - 24 * Canvas.scale;
        Canvas.updateTransform();
    },

    filterResources(category) {
        this.resourceFilter = category;
        
        document.querySelectorAll('.resource-categories .category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category === category);
        });
        
        this.renderResourceList();
    },

    renderResourceList() {
        const container = document.getElementById('resource-list');
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        let resources = project.nodes.filter(n => n.type === 'resource');
        
        // 分类筛选
        if (this.resourceFilter === 'custom') {
            // 自定义类型：只显示属于自定义资源类型的节点
            const customIds = (project.customResourceTypes || [])
                .filter(t => ['currency', 'material', 'stamina'].includes(t.id) === false)
                .map(t => t.id);
            resources = resources.filter(r => customIds.includes(r.resourceType));
        } else if (this.resourceFilter !== 'all') {
            resources = resources.filter(r => r.resourceType === this.resourceFilter);
        }
        
        if (resources.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-light);font-size:13px;">暂无资源</div>';
            return;
        }
        
        container.innerHTML = resources.map(res => {
            const resType = this._findResourceType(res.resourceType, project.customResourceTypes);
            const iconClass = resType?.icon || 'fa-gem';
            const typeColor = resType?.color || '#8b5cf6';
            return `
            <div class="resource-item" draggable="true" data-resource-id="${res.id}">
                <div class="resource-icon" style="background:${typeColor}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="resource-info">
                    <div class="resource-name">${this.escapeHtml(res.name)}</div>
                    <div class="resource-type-badge">${resType ? resType.name : (res.resourceType || '未分类')}</div>
                </div>
                <div class="rarity-dot ${res.rarity || 'common'}" title="${res.rarity || '普通'}"></div>
            </div>`;
        }).join('');
        
        // 绑定点击事件
        container.querySelectorAll('.resource-item').forEach(item => {
            const resId = item.dataset.resourceId;
            
            item.addEventListener('click', () => {
                container.querySelectorAll('.resource-item').forEach(i => i.classList.remove('selected'));
                container.querySelectorAll('.res-type-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                const node = project.nodes.find(n => n.id === resId);
                if (node) {
                    // 选中画布节点并定位
                    Canvas.selectNode(resId);
                    LeftPanel.focusNodeInCanvas(resId);
                    // 右侧显示该节点属性面板
                    PropertyPanel.showNodeProperty(resId);
                }
            });
            
            // 拖拽事件
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('resourceId', resId);
            });
        });
    },

    /**
     * 渲染资源类型列表（在资源库Tab顶部）
     */
    renderResourceTypeList() {
        const container = document.getElementById('resource-type-list');
        const project = DataStore.getCurrentProject();
        if (!project) return;

        const types = project.customResourceTypes || [];
        container.innerHTML = types.map(type => {
            const nodeCount = project.nodes.filter(n =>
                n.type === 'resource' && n.resourceType === type.id
            ).length;
            return `
            <div class="res-type-item" data-res-type-id="${type.id}" draggable="true">
                <div class="res-type-icon" style="background:${type.color}">
                    <i class="fas ${type.icon}"></i>
                </div>
                <span class="res-type-name">${this.escapeHtml(type.name)}</span>
                <span class="res-type-count">${nodeCount}</span>
            </div>`;
        }).join('');

        // 点击 → 显示右侧关联信息
        container.querySelectorAll('.res-type-item').forEach(item => {
            item.addEventListener('click', () => {
                // 切换选中态
                container.querySelectorAll('.res-type-item').forEach(i => i.classList.remove('selected'));
                container.querySelectorAll('.resource-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                const typeId = item.dataset.resTypeId;
                PropertyPanel.showResourceTypeEdit(typeId);
            });

            // 拖拽到画布 → 创建新资源节点
            item.addEventListener('dragstart', (e) => {
                const typeId = item.dataset.resTypeId;
                const typeName = item.querySelector('.res-type-name').textContent;
                e.dataTransfer.setData('new-resource-type-id', typeId);
                e.dataTransfer.setData('new-resource-type-name', typeName);
                e.dataTransfer.effectAllowed = 'copy';
            });

            item.addEventListener('dragend', () => {
                container.querySelectorAll('.res-type-item').forEach(i => i.classList.remove('selected'));
            });
        });
    },

    /**
     * 新建资源类型
     */
    addResourceType() {
        Modal.open('resource-type');
    },

    /** 根据ID查找资源类型信息 */
    _findResourceType(typeId, types) {
        if (!types) return null;
        return types.find(t => t.id === typeId) || null;
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    triggerImport() {
        document.getElementById('import-file-input').click();
    },

    handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = DataStore.importData(e.target.result);
                if (project) {
                    Toast.show(`导入成功：${project.name}`, 'success');
                    this.renderProjectList();
                } else {
                    Toast.show('导入失败，文件格式不正确', 'error');
                }
            } catch (err) {
                Toast.show('导入失败：' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        
        // 重置input，允许重复选择同一文件
        event.target.value = '';
    },

    toggleShortcutHelp() {
        document.getElementById('shortcut-help').classList.toggle('hidden');
    }
};

// ==================== 属性面板模块 ====================
const PropertyPanel = {
    currentNodeId: null,
    currentEdgeId: null,

    /**
     * 解析概率输入，自动转换为百分比格式
     * 支持: 0.3 → 30%, 30 → 30%, 30% → 30%
     * 返回转换后的显示字符串
     */
    parseProbability(input) {
        if (!input) return { display: '', valid: true, value: null };
        
        let num = input.toString().replace('%', '').trim();
        let isPercent = input.toString().includes('%');
        
        // 如果没有%，检查是否需要转换
        if (!isPercent) {
            const parsed = parseFloat(num);
            if (!isNaN(parsed)) {
                // 0-1之间的小数视为0-100%
                if (parsed <= 1 && parsed > 0) {
                    num = (parsed * 100).toString();
                }
            }
        }
        
        const value = parseFloat(num);
        
        if (isNaN(value)) {
            return { display: input, valid: true, value: input };
        }
        
        // 检查是否超过100%
        if (value > 100) {
            return { display: input, valid: false, value: value, error: '概率不能超过100%' };
        }
        
        // 转换为标准格式
        const display = Math.round(value * 10) / 10 + '%';
        return { display, valid: true, value: display };
    },

    /**
     * 验证并格式化概率输入（供 onchange 调用）
     */
    validateProbability(input, onValid) {
        const result = this.parseProbability(input);
        
        if (!result.valid) {
            Toast.show(result.error, 'warning');
            return;
        }
        
        if (result.value && onValid) {
            onValid(result.value);
        }
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    showDefault() {
        document.getElementById('property-panel').classList.remove('hidden');
        document.getElementById('node-property').classList.add('hidden');
        document.getElementById('edge-property').classList.add('hidden');
        document.getElementById('resource-type-info').classList.add('hidden');
        document.getElementById('resource-type-edit').classList.add('hidden');
        this.currentNodeId = null;
        this.currentEdgeId = null;
        this.currentResTypeId = null;
    },

    showNodeProperty(nodeId) {
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        const node = project.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        this.currentNodeId = nodeId;
        this.currentEdgeId = null;
        
        document.getElementById('property-panel').classList.add('hidden');
        document.getElementById('edge-property').classList.add('hidden');
        document.getElementById('resource-type-info').classList.add('hidden');
        document.getElementById('node-property').classList.remove('hidden');
        
        // 填充数据
        document.getElementById('prop-node-name').textContent = node.name;
        document.getElementById('prop-input-name').value = node.name;
        
        const badge = document.querySelector('#node-property .badge');
        badge.textContent = node.type === 'system' ? '系统' : '资源';
        badge.className = `badge ${node.type}`;
        
        // 资源数量配置（仅资源节点显示）
        const qtyGroupEl = document.getElementById('prop-group-quantity');
        if (node.type === 'resource') {
            qtyGroupEl.style.display = '';

            // 检查是否有输入边连接到此资源节点
            const hasInputEdges = project.edges.some(
                e => e.target === node.id && e.type === 'output'
            );

            const qtyLabel = qtyGroupEl.querySelector('label');
            const qtyInner = qtyGroupEl.querySelector('div[style*="display:flex"]');

            if (hasInputEdges) {
                // 有输入边：显示计算值，不可手动修改
                if (qtyLabel) qtyLabel.innerHTML = '<i class="fas fa-calculator"></i> 数值来源（自动计算）';
                if (qtyInner) {
                    qtyInner.innerHTML = `
                        <span id="computed-qty-display" style="flex:1;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;font-size:13px;color:var(--text-light);cursor:default;">
                            由连接到该节点的输出端口数值自动汇总
                        </span>`;
                    // 计算并显示值
                    this._refreshComputedQuantity(node);
                }
            } else {
                // 无输入边：允许手动配置数量
                if (qtyLabel) qtyLabel.innerHTML = '<i class="fas fa-hashtag"></i> 资源数量';
                if (qtyInner) {
                    qtyInner.innerHTML = `
                        <input type="number" id="prop-input-quantity" min="0" placeholder="无连接时可手动配置数量"
                            oninput="PropertyPanel.updateResourceQuantity(this.value)"
                            style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:13px;background:var(--bg-secondary);outline:none;">
                        <button class="btn btn-sm btn-primary" onclick="PropertyPanel.toggleResourceNodeVisibility(true)"
                            title="在画布上显示此节点">
                            显示
                        </button>
                        <button class="btn btn-sm" onclick="PropertyPanel.toggleResourceNodeVisibility(false)" title="从画布隐藏此节点">
                            隐藏
                        </button>`;
                    document.getElementById('prop-input-quantity').value =
                        node.quantity !== null && node.quantity !== undefined ? node.quantity : '';
                }
            }

            // 资源节点颜色配置
            const resColorGroupEl = document.getElementById('prop-group-res-color');
            resColorGroupEl.style.display = '';
            const resColorInput = document.getElementById('prop-input-res-color');
            resColorInput.value = node.nodeColor || '#f59e0b';
        } else {
            qtyGroupEl.style.display = 'none';
        }
        
        // 根据类型显示/隐藏不同字段
        document.getElementById('prop-group-level').style.display = node.type === 'system' ? '' : 'none';
        document.getElementById('prop-group-rarity').style.display = node.type === 'resource' ? '' : 'none';

        // 父节点：资源节点固定为资源类型（不可调整）；系统节点可选
        const parentGroupEl = document.getElementById('prop-group-parent');
        if (node.type === 'resource') {
            // 资源节点：显示资源类型（只读），不能改父节点
            const resType = (project.customResourceTypes || []).find(t => t.id === node.resourceType);
            parentGroupEl.innerHTML = `
                <label>所属类型</label>
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px;font-size:13px;cursor:not-allowed;">
                    <i class="fas ${resType?.icon || 'fa-gem'}" style="color:${resType?.color || '#8b5cf6'}"></i>
                    <span>${resType ? resType.name : (node.resourceType || '未分类')}</span>
                </div>`;
        } else {
            // 系统节点：可选择的父节点下拉框
            parentGroupEl.innerHTML = `
                <label>父节点</label>
                <select id="prop-select-parent" onchange="PropertyPanel.updateNodeProperty('parentId', this.value)">
                    <option value="">无（根节点）</option>
                </select>`;
            const allSystems = project.nodes.filter(n => n.type === 'system' && n.id !== nodeId);
            document.getElementById('prop-select-parent').innerHTML = '<option value="">无（根节点）</option>' +
                allSystems.map(n => `<option value="${n.id}" ${n.id === node.parentId ? 'selected' : ''}>${n.name}</option>`).join('');
        }

        // 子类型选择器（系统节点和资源节点都支持）
        document.getElementById('prop-group-type-detail').style.display = '';
        
        // 填充基础属性
        document.getElementById('prop-input-level').value = node.level || 1;
        document.getElementById('prop-textarea-desc').value = node.description || '';
        document.getElementById('prop-input-tags').value = (node.tags || []).join(', ');
        document.getElementById('prop-select-rarity').value = node.rarity || 'common';
        
        // 根级父节点配置（角色定义+颜色）
        const isRootParent = node.type === 'system' && !node.parentId;
        const rootConfigGroupEl = document.getElementById('prop-group-root-config');
        if (isRootParent) {
            rootConfigGroupEl.style.display = '';
            document.getElementById('prop-input-role-name').value = node.roleName || '';
            // 角色类型（产出/消耗）
            const roleType = node.role || 'output';
            document.querySelectorAll('input[name="prop-role-type"]').forEach(radio => {
                radio.checked = radio.value === roleType;
            });
            // 分组颜色（parentColor）
            const parentColor = node.parentColor || '#3b82f6';
            document.getElementById('prop-input-parent-color').value = parentColor;
            document.getElementById('prop-parent-color-hex').textContent = parentColor;
            // 角色边框颜色（roleColor）
            const roleColor = node.roleColor || '#f59e0b';
            document.getElementById('prop-input-role-color').value = roleColor;
            document.getElementById('prop-role-color-hex').textContent = roleColor;
        } else {
            rootConfigGroupEl.style.display = 'none';
        }
        
        // 填充子类型选择器（从项目自定义列表）
        this.renderSubTypeSelect(node.subType);
        
        // 渲染端口管理列表
        this.renderPortLists(node);
    },

    showMultiProperty(selectedNodes) {
        this.currentNodeId = null;
        this.currentEdgeId = null;

        document.getElementById('property-panel').classList.add('hidden');
        document.getElementById('edge-property').classList.add('hidden');
        
        const nodePropEl = document.getElementById('node-property');
        nodePropEl.classList.remove('hidden');
        
        // 显示多选信息
        const count = selectedNodes.size;
        const names = [...selectedNodes].slice(0, 3).map(id => {
            const project = DataStore.getCurrentProject();
            if (!project) return '';
            const n = project.nodes.find(nd => nd.id === id);
            return n ? n.name : id;
        }).filter(Boolean).join(', ') + (count > 3 ? ` ... +${count - 3}` : '');
        
        document.getElementById('prop-node-name').textContent = `已选择 ${count} 个节点`;
        document.getElementById('prop-input-name').value = names;
    },

    showEdgeProperty(edgeId) {
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        const edge = project.edges.find(e => e.id === edgeId);
        if (!edge) return;
        
        this.currentEdgeId = edgeId;
        this.currentNodeId = null;
        
        document.getElementById('property-panel').classList.add('hidden');
        document.getElementById('node-property').classList.add('hidden');
        document.getElementById('edge-property').classList.remove('hidden');
        
        // 填充数据
        const typeBadge = document.getElementById('prop-edge-type-badge');
        typeBadge.textContent = edge.type === 'output' ? '产出' : edge.type === 'consume' ? '消耗' : edge.type;
        typeBadge.className = `badge ${edge.type}`;
        
        document.getElementById('prop-edge-type').value = edge.type || 'output';
        document.getElementById('prop-edge-value-type').value = edge.valueType || 'fixed';
        document.getElementById('prop-edge-condition').value = edge.condition || '';
        
        // 连线颜色
        const defaultColor = edge.type === 'output' ? '#22c55e' : (edge.type === 'consume' ? '#ef4444' : '#94a3b8');
        document.getElementById('prop-input-edge-color').value = edge.color || defaultColor;
        
        // 数值类型相关
        this.updateValueFields(edge.valueType || 'fixed');
        
        document.getElementById('prop-edge-value').value = edge.value || '';
        document.getElementById('prop-edge-min').value = edge.minValue || '';
        document.getElementById('prop-edge-max').value = edge.maxValue || '';
        
        // 分流配置
        this._loadSplitConfig(edge);
    },

    /**
     * 加载分流配置
     */
    _loadSplitConfig(edge) {
        const splitGroup = document.getElementById('prop-group-split');
        const splitType = document.getElementById('prop-edge-split-type');
        const splitValue = document.getElementById('prop-edge-split-value');
        const splitAmountContainer = document.getElementById('prop-split-amount-container');
        const splitAmount = document.getElementById('prop-edge-split-amount');
        
        // 检查该输出端口是否连接了多个输入端口
        const project = DataStore.getCurrentProject();
        const outPortId = edge.sourcePortId;
        const connectedEdges = project.edges.filter(e => 
            e.source === edge.source && e.sourcePortId === outPortId
        );
        
        // 只有当输出端口连接多个输入端口时才显示分流配置
        if (connectedEdges.length > 1) {
            splitGroup.style.display = '';
            splitType.value = edge.splitType || 'value';
            splitValue.value = edge.splitValue || '';
            splitAmount.value = edge.splitAmount || 1;
            this._updateSplitUI(edge.splitType || 'value');
        } else {
            splitGroup.style.display = 'none';
        }
    },

    /**
     * 更新分流配置UI
     */
    updateSplitType(value) {
        this._updateSplitUI(value);
        this._saveSplitConfig();
    },

    updateSplitValue(value) {
        this._saveSplitConfig();
    },

    updateSplitAmount(value) {
        this._saveSplitConfig();
    },

    _updateSplitUI(splitType) {
        const amountContainer = document.getElementById('prop-split-amount-container');
        const valueInput = document.getElementById('prop-edge-split-value');
        
        if (splitType === 'percentage-amount') {
            amountContainer.style.display = '';
            valueInput.placeholder = '如 30%';
        } else if (splitType === 'percentage') {
            amountContainer.style.display = 'none';
            valueInput.placeholder = '如 30%';
        } else {
            amountContainer.style.display = 'none';
            valueInput.placeholder = '数值';
        }
    },

    _saveSplitConfig() {
        if (!this.currentEdgeId) return;
        const splitType = document.getElementById('prop-edge-split-type')?.value;
        const splitValue = document.getElementById('prop-edge-split-value')?.value;
        const splitAmount = document.getElementById('prop-edge-split-amount')?.value;
        
        DataStore.updateEdge(this.currentEdgeId, {
            splitType,
            splitValue: splitValue || null,
            splitAmount: parseFloat(splitAmount) || 1
        });
        Canvas.refresh();
    },

    updateValueFields(valueType) {
        const fixedGroup = document.getElementById('prop-edge-value-fixed');
        const rangeGroup = document.getElementById('prop-edge-value-range');
        
        if (valueType === 'fixed' || valueType === 'dynamic' || valueType === 'percentage') {
            fixedGroup.classList.remove('hidden');
            rangeGroup.classList.add('hidden');
        } else if (valueType === 'range') {
            fixedGroup.classList.add('hidden');
            rangeGroup.classList.remove('hidden');
        }
    },

    updateEdgeColor(color) {
        if (!this.currentEdgeId) return;
        DataStore.updateEdge(this.currentEdgeId, { color: color });
        document.getElementById('prop-input-edge-color').value = color;
        Canvas.refresh();
    },

    updateNodeProperty(prop, value) {
        if (!this.currentNodeId) return;
        
        let updateData = {};
        if (prop === 'tags') {
            updateData.tags = value.split(',').map(t => t.trim()).filter(Boolean);
        } else {
            updateData[prop] = prop === 'level' ? parseInt(value) || 1 : value;
        }
        
        DataStore.updateNode(this.currentNodeId, updateData);
        
        // 实时更新画布上的节点显示
        Canvas.refresh();
        LeftPanel.renderSystemTree();
        LeftPanel.renderResourceList();
    },

    updateEdgeProperty(prop, value) {
        if (!this.currentEdgeId) return;
        
        DataStore.updateEdge(this.currentEdgeId, { [prop]: value });
        Canvas.refresh();
    },

    deleteCurrentNode() {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;
        
        if (confirm(`确定要删除节点"${node.name}"及其所有关联关系吗？`)) {
            DataStore.deleteNode(this.currentNodeId);
            Canvas.refresh();
            LeftPanel.renderSystemTree();
            LeftPanel.renderResourceList();
            this.showDefault();
            Toast.show('节点已删除', 'success');
        }
    },

    deleteCurrentEdge() {
        if (!this.currentEdgeId) return;
        
        if (confirm('确定要删除这条关系吗？')) {
            DataStore.deleteEdge(this.currentEdgeId);
            Canvas.refresh();
            this.showDefault();
            Toast.show('关系已删除', 'success');
        }
    },

    // ==================== 端口管理 ====================

    renderPortLists(node) {
        const inputContainer = document.getElementById('prop-input-ports-list');
        const outputContainer = document.getElementById('prop-output-ports-list');
        
        // 输入端口列表（继承自输出端口时只读，但可调整接收数量）
        const inputs = node.inputPorts || [];
        inputContainer.innerHTML = inputs.map((p, idx) => {
            const isInherited = !!p.inheritedFrom;
            const isProbAmount = p.portType === 'prob-amount';
            const isProbTable = p.portType === 'prob-table';
            
            // 如果是继承的概率类型，显示数量/掉落表信息
            let extraInfo = '';
            if (isInherited && (isProbAmount || isProbTable)) {
                if (isProbAmount && p.portAmount != null) {
                    extraInfo = `<span style="font-size:10px;color:var(--text-light);margin-left:4px;">×${p.portAmount}</span>`;
                } else if (isProbTable && p.dropTable?.length) {
                    extraInfo = `<span style="font-size:10px;color:var(--text-light);margin-left:4px;">${p.dropTable.length}项</span>`;
                }
            }
            
            return `
            <div class="port-item">
                <span class="port-dot input-port-dot"></span>
                <input type="text" value="${this.escapeHtml(p.name)}" 
                    placeholder="输入端口名称"
                    ${isInherited ? 'readonly disabled style="background:var(--bg-primary);cursor:default;" title="已继承输出端口名称（不可修改）"' : `onchange="PropertyPanel.renamePort('input', ${idx}, this.value)"`}
                    style="${isInherited ? 'background:var(--bg-primary);cursor:default;flex:1;' : 'flex:1;'}">
                ${extraInfo}
                ${isInherited ? '<span style="font-size:10px;color:var(--text-light);padding:0 4px;" title="已继承输出端口">↙继承</span>' : ''}
                <button class="btn-del-port" onclick="PropertyPanel.removePort('input', ${idx})" title="删除">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `}).join('');
        
        // 输出端口列表（支持配置类型：数值/概率/概率掉落）
        const outputs = node.outputPorts || [];
        outputContainer.innerHTML = outputs.map((p, idx) => {
            const isProbAmount = p.portType === 'prob-amount';
            const isProbTable = p.portType === 'prob-table';
            
            // 获取掉落表数据
            const dropTable = p.dropTable || [];
            
            let extraInput = '';
            if (isProbAmount) {
                // 概率+固定数量
                extraInput = `
                    <div style="display:flex;align-items:center;gap:4px;width:100%;padding-left:16px;margin-top:2px;">
                        <span style="font-size:10px;color:var(--text-light);width:30px;">数量:</span>
                        <input type="number" value="${p.portAmount || ''}" 
                            placeholder="数量"
                            onchange="PropertyPanel.updatePortAmount('output', ${idx}, this.value)"
                            style="flex:1;padding:3px 6px;font-size:11px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-secondary);outline:none;color:inherit;">
                    </div>`;
            } else if (isProbTable) {
                // 概率掉落表
                const tableRows = dropTable.map((item, tidx) => `
                    <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
                        <input type="text" value="${item.prob || ''}" 
                            placeholder="30%"
                            onchange="PropertyPanel.updateDropTableItem(${idx}, ${tidx}, 'prob', this.value)"
                            style="width:50px;padding:2px 4px;font-size:10px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-secondary);">
                        <span style="font-size:10px;">→</span>
                        <input type="number" value="${item.amount || ''}" 
                            placeholder="数量"
                            onchange="PropertyPanel.updateDropTableItem(${idx}, ${tidx}, 'amount', this.value)"
                            style="width:50px;padding:2px 4px;font-size:10px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-secondary);">
                        <button onclick="PropertyPanel.removeDropTableItem(${idx}, ${tidx})" style="padding:2px 4px;font-size:10px;background:none;border:none;color:var(--text-light);cursor:pointer;">×</button>
                    </div>
                `).join('');
                extraInput = `
                    <div style="width:100%;padding-left:16px;margin-top:4px;font-size:10px;border-top:1px solid var(--border-color);padding-top:4px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                            <span style="color:var(--text-light);">掉落表：</span>
                            <button onclick="PropertyPanel.addDropTableItem(${idx})" style="padding:2px 6px;font-size:10px;background:var(--primary);color:white;border:none;border-radius:3px;cursor:pointer;">+添加</button>
                        </div>
                        ${tableRows}
                    </div>`;
            }
            
            const placeholder = p.portType === 'probability' ? '如 0.3 或 30%' : 
                               p.portType === 'prob-amount' ? '如 0.3' :
                               p.portType === 'prob-table' ? '概率掉落表模式' : '如 100';
            const title = p.portType === 'probability' ? '填写概率值' : 
                         p.portType === 'prob-amount' ? '填写概率值' :
                         p.portType === 'prob-table' ? '使用下方掉落表' : '填写数值';
            
            return `
            <div class="port-item" style="flex-wrap:wrap;gap:4px;">
                <div style="display:flex;align-items:center;gap:4px;width:100%;">
                    <span class="port-dot output-port-dot"></span>
                    <input type="text" value="${this.escapeHtml(p.name)}" 
                        placeholder="输出端口名称"
                        onchange="PropertyPanel.renamePort('output', ${idx}, this.value)"
                        style="flex:1;min-width:0;">
                </div>
                <div style="display:flex;align-items:center;gap:4px;width:100%;padding-left:16px;">
                    <select onchange="PropertyPanel.updatePortType('output', ${idx}, this.value)" style="width:75px;padding:2px 4px;font-size:11px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-secondary);color:inherit;">
                        <option value="value" ${p.portType === 'value' || !p.portType ? 'selected' : ''}>数值</option>
                        <option value="probability" ${p.portType === 'probability' ? 'selected' : ''}>概率</option>
                        <option value="prob-amount" ${p.portType === 'prob-amount' ? 'selected' : ''}>概率掉落</option>
                        <option value="prob-table" ${p.portType === 'prob-table' ? 'selected' : ''}>掉落表</option>
                    </select>
                    ${p.portType === 'prob-table' ? '' : `
                    <input type="text" value="${p.portValue != null ? p.portValue : ''}" 
                        placeholder="${placeholder}"
                        onchange="PropertyPanel.updatePortValue('output', ${idx}, this.value)"
                        title="${title}"
                        style="flex:1;padding:3px 6px;font-size:11px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-secondary);outline:none;color:inherit;">
                    `}
                    <button class="btn-del-port" onclick="PropertyPanel.removePort('output', ${idx})" title="删除">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${extraInput}
            </div>
        `}).join('');
        
        // 空状态提示
        if (inputs.length === 0) {
            inputContainer.innerHTML = '<div style="color:var(--text-light);font-size:12px;padding:4px 0;">暂无输入端口</div>';
        }
        if (outputs.length === 0) {
            outputContainer.innerHTML = '<div style="color:var(--text-light);font-size:12px;padding:4px 0;">暂无输出端口</div>';
        }
    },

    addPort(portType) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;
        
        DataStore.pushHistory();
        
        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        if (!node[key]) node[key] = [];
        
        const newPort = { id: DataStore.generatePortId(), name: portType === 'input' ? '新输入' : '新输出', portType: portType === 'output' ? 'value' : undefined };
        node[key].push(newPort);
        DataStore.save();
        
        // 刷新UI
        this.renderPortLists(node);
        Canvas.refresh(); // 重绘节点卡片
        Toast.show(`已添加${portType === 'input' ? '输入' : '输出'}端口`, 'success');
    },

    removePort(portType, index) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;
        
        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        const ports = node[key] || [];
        
        if (index < 0 || index >= ports.length) return;
        
        // 检查该端口是否有连线
        const portToRemove = ports[index];
        const hasConnections = project.edges.some(e => {
            if (e.source !== node.id && e.target !== node.id) return false;
            if (portType === 'output') {
                return e.source === node.id && (e.sourcePortId === portToRemove.id || ports.length <= 2);
            } else {
                return e.target === node.id && (e.targetPortId === portToRemove.id || ports.length <= 2);
            }
        });
        
        if (hasConnections && !confirm('该端口有关联连线，确定要删除吗？相关连线将被移除。')) {
            return;
        }
        
        DataStore.pushHistory();
        
        // 移除关联边
        const removedPortIds = [portToRemove.id];
        project.edges = project.edges.filter(e => {
            if (e.source === node.id && portType === 'output') {
                return !removedPortIds.includes(e.sourcePortId);
            }
            if (e.target === node.id && portType === 'input') {
                return !removedPortIds.includes(e.targetPortId);
            }
            return true;
        });
        
        // 从节点移除端口
        node[key].splice(index, 1);
        DataStore.save();
        
        this.renderPortLists(node);
        Canvas.refresh();
        Toast.show(`已删除端口`, 'success');
    },

    renamePort(portType, index, newName) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;
        
        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        const ports = node[key] || [];
        if (ports[index]) {
            const oldName = ports[index].name;
            const newNameTrimmed = newName.trim() || (portType === 'input' ? '输入' : '输出');
            
            DataStore.pushHistory();
            ports[index].name = newNameTrimmed;
            DataStore.save();
            
            // 如果是输出端口修改，同步更新所有继承自该端口的输入端口
            if (portType === 'output') {
                const sourcePortId = ports[index].id;
                project.nodes.forEach(n => {
                    if (n.type === 'resource') {
                        const inheritedPorts = (n.inputPorts || []).filter(p => p.inheritedFrom === sourcePortId);
                        inheritedPorts.forEach(p => { p.name = newNameTrimmed; });
                    }
                });
                DataStore.save();
                
                // 刷新继承端口的节点属性面板
                project.nodes.filter(n => n.type === 'resource').forEach(n => {
                    const hasInherited = (n.inputPorts || []).some(p => p.inheritedFrom === sourcePortId);
                    if (hasInherited && this.currentNodeId === n.id) {
                        this.renderPortLists(n);
                    }
                });
            }
            
            Canvas.refresh(); // 重绘节点卡片上的标签
        }
    },

    updatePortType(portType, index, newType) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        const ports = node[key] || [];
        if (ports[index]) {
            DataStore.pushHistory();
            ports[index].portType = newType;
            
            // 新类型如果是概率掉落或掉落表，初始化相关数据
            if (newType === 'prob-amount' && !ports[index].portAmount) {
                ports[index].portAmount = 1;
            }
            if (newType === 'prob-table' && !ports[index].dropTable) {
                ports[index].dropTable = [{ prob: '', amount: 1 }];
            }
            
            DataStore.save();
            
            // 重新渲染端口列表以显示额外输入框
            this.renderPortLists(node);
            
            // 如果是输出端口修改，同步更新所有继承自该端口的输入端口
            if (portType === 'output') {
                const sourcePortId = ports[index].id;
                project.nodes.forEach(n => {
                    if (n.type === 'resource') {
                        const inheritedPorts = (n.inputPorts || []).filter(p => p.inheritedFrom === sourcePortId);
                        inheritedPorts.forEach(p => { 
                            p.portType = newType;
                            if (newType === 'prob-amount') p.portAmount = ports[index].portAmount;
                            if (newType === 'prob-table') p.dropTable = ports[index].dropTable ? [...ports[index].dropTable] : null;
                        });
                    }
                });
                DataStore.save();
                
                // 刷新继承端口的节点属性面板
                project.nodes.filter(n => n.type === 'resource').forEach(n => {
                    const hasInherited = (n.inputPorts || []).some(p => p.inheritedFrom === sourcePortId);
                    if (hasInherited && this.currentNodeId === n.id) {
                        this.renderPortLists(n);
                    }
                });
            }
            
            Canvas.refresh(); // 重绘资源节点卡上的计算值
        }
    },

    updatePortValue(portType, index, valueStr) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        const ports = node[key] || [];
        const currentPort = ports[index];
        
        if (currentPort) {
            // 概率类输入需要验证和转换格式
            if (currentPort.portType === 'probability' || currentPort.portType === 'prob-amount') {
                const parsed = this.parseProbability(valueStr);
                if (!parsed.valid) {
                    Toast.show(parsed.error, 'warning');
                    return;
                }
                // 自动转换为带%格式
                currentPort.portValue = parsed.value;
            } else {
                currentPort.portValue = valueStr.trim() !== '' ? valueStr : null;
            }
            
            DataStore.save();
            
            // 同步更新继承的输入端口
            if (portType === 'output') {
                const sourcePortId = currentPort.id;
                project.nodes.forEach(n => {
                    if (n.type === 'resource') {
                        const inheritedPorts = (n.inputPorts || []).filter(p => p.inheritedFrom === sourcePortId);
                        inheritedPorts.forEach(p => { p.portValue = currentPort.portValue; });
                    }
                });
                DataStore.save();
            }
            
            Canvas.refresh(); // 立即更新资源节点卡显示
        }
    },

    // 更新概率掉落数量
    updatePortAmount(portType, index, value) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const key = portType === 'input' ? 'inputPorts' : 'outputPorts';
        const ports = node[key] || [];
        if (ports[index]) {
            ports[index].portAmount = value !== '' ? parseFloat(value) : null;
            DataStore.save();
            
            // 同步更新继承的输入端口
            if (portType === 'output') {
                const sourcePortId = ports[index].id;
                project.nodes.forEach(n => {
                    if (n.type === 'resource') {
                        const inheritedPorts = (n.inputPorts || []).filter(p => p.inheritedFrom === sourcePortId);
                        inheritedPorts.forEach(p => { p.portAmount = ports[index].portAmount; });
                    }
                });
                DataStore.save();
            }
            
            Canvas.refresh();
        }
    },

    // 添加掉落表条目
    addDropTableItem(outputIndex) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const ports = node.outputPorts || [];
        if (!ports[outputIndex]) return;

        if (!ports[outputIndex].dropTable) ports[outputIndex].dropTable = [];
        ports[outputIndex].dropTable.push({ prob: '', amount: 1 });
        DataStore.save();
        
        this.renderPortLists(node);
        Canvas.refresh();
    },

    // 更新掉落表条目
    updateDropTableItem(outputIndex, tableIndex, field, value) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const ports = node.outputPorts || [];
        if (!ports[outputIndex] || !ports[outputIndex].dropTable) return;

        // 如果是概率字段，验证并转换格式
        if (field === 'prob') {
            const parsed = this.parseProbability(value);
            if (!parsed.valid) {
                Toast.show(parsed.error, 'warning');
                return;
            }
            ports[outputIndex].dropTable[tableIndex].prob = parsed.value || '';
        } else {
            ports[outputIndex].dropTable[tableIndex][field] = field === 'prob' ? value : (value !== '' ? parseFloat(value) : null);
        }
        
        DataStore.save();
        
        // 同步更新继承的输入端口
        const sourcePortId = ports[outputIndex].id;
        project.nodes.forEach(n => {
            if (n.type === 'resource') {
                const inheritedPorts = (n.inputPorts || []).filter(p => p.inheritedFrom === sourcePortId);
                inheritedPorts.forEach(p => { 
                    if (!p.dropTable) p.dropTable = [];
                    p.dropTable[tableIndex] = ports[outputIndex].dropTable[tableIndex];
                });
            }
        });
        DataStore.save();
        
        // 刷新UI
        this.renderPortLists(node);
        Canvas.refresh();
    },

    // 删除掉落表条目
    removeDropTableItem(outputIndex, tableIndex) {
        if (!this.currentNodeId) return;
        const project = DataStore.getCurrentProject();
        const node = project?.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;

        const ports = node.outputPorts || [];
        if (!ports[outputIndex] || !ports[outputIndex].dropTable) return;

        ports[outputIndex].dropTable.splice(tableIndex, 1);
        DataStore.save();
        
        this.renderPortLists(node);
        Canvas.refresh();
    },

    // ==================== 子类型管理 ====================

    renderSubTypeSelect(currentValue) {
        const select = document.getElementById('prop-select-subtype');
        const project = DataStore.getCurrentProject();
        const subTypes = project?.customSubTypes || [
            { id: 'normal', name: '普通' },
            { id: 'key', name: '关键' },
            { id: 'daily', name: '日常' },
            { id: 'weekly', name: '周常' }
        ];
        
        select.innerHTML = '<option value="">无</option>' +
            subTypes.map(st => `<option value="${st.id}" ${st.id === currentValue ? 'selected' : ''}>${st.name}</option>`).join('');
    },

    /** 渲染预设颜色选择器 */
    renderPresetColors(currentColor) {
        // 已迁移至 prop-group-root-config，保留以防旧引用
    },

    /** 设置分组颜色（快捷预设点击） */
    setParentColor(color) {
        this.updateParentColor(color);
    },

    /** 更新分组颜色（parentColor - 图标背景色） */
    updateParentColor(color) {
        if (!this.currentNodeId) return;
        document.getElementById('prop-input-parent-color').value = color;
        document.getElementById('prop-parent-color-hex').textContent = color;
        DataStore.updateNode(this.currentNodeId, { parentColor: color });
        Canvas.refresh();
    },

    /** 设置角色颜色（快捷预设点击） */
    setRoleColor(color) {
        this.updateRoleColor(color);
    },

    /** 更新角色颜色（roleColor - 子节点卡边框色） */
    updateRoleColor(color) {
        if (!this.currentNodeId) return;
        document.getElementById('prop-input-role-color').value = color;
        document.getElementById('prop-role-color-hex').textContent = color;
        DataStore.updateNode(this.currentNodeId, { roleColor: color });
        Canvas.refresh();
    },

    updateRoleColorUI(color) {
        document.getElementById('prop-input-role-color').value = color;
    },

    openSubTypeManager() {
        Modal.open('subtype-manage');
        this.renderSubTypeList();
    },

    renderSubTypeList() {
        const container = document.getElementById('subtype-list');
        const project = DataStore.getCurrentProject();
        if (!project || !container) return;
        
        const subTypes = project.customSubTypes || [];
        
        container.innerHTML = subTypes.map((st, idx) => `
            <div class="subtype-item">
                <span>${this.escapeHtml(st.name)}</span>
                <button class="btn-del-subtype" onclick="PropertyPanel.removeCustomSubType(${idx})" title="删除此子类型">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        if (subTypes.length === 0) {
            container.innerHTML = '<div style="color:var(--text-light);font-size:13px;text-align:center;padding:20px 0;">暂无自定义子类型</div>';
        }
    },

    addCustomSubType() {
        const input = document.getElementById('new-subtype-input');
        const name = (input.value || '').trim();
        if (!name) {
            Toast.show('请输入子类型名称', 'warning');
            return;
        }
        
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        if (!project.customSubTypes) project.customSubTypes = [];
        
        // 检查重复
        if (project.customSubTypes.some(s => s.name === name)) {
            Toast.show('该子类型已存在', 'warning');
            return;
        }
        
        DataStore.pushHistory();
        project.customSubTypes.push({ id: 'custom_' + Date.now(), name: name });
        DataStore.save();
        
        input.value = '';
        this.renderSubTypeList();
        // 同时刷新属性面板中的选择器
        if (this.currentNodeId) {
            const node = project.nodes.find(n => n.id === this.currentNodeId);
            if (node) this.renderSubTypeSelect(node.subType);
        }
        Toast.show(`已添加子类型"${name}"`, 'success');
    },

    removeCustomSubType(index) {
        const project = DataStore.getCurrentProject();
        if (!project || !project.customSubTypes) return;
        
        const st = project.customSubTypes[index];
        if (!st) return;
        
        // 检查是否有节点在使用这个子类型
        const usedBy = project.nodes.filter(n => n.subType === st.id);
        let msg = `确定要删除子类型"${st.name}"吗？`;
        if (usedBy.length > 0) {
            msg += `\n（有 ${usedBy.length} 个节点正在使用）`;
        }
        
        if (!confirm(msg)) return;
        
        DataStore.pushHistory();
        project.customSubTypes.splice(index, 1);
        
        // 将使用该子类型的节点重置为 null
        project.nodes.forEach(n => {
            if (n.subType === st.id) n.subType = null;
        });
        
        DataStore.save();
        
        this.renderSubTypeList();
        if (this.currentNodeId) {
            const node = project.nodes.find(n => n.id === this.currentNodeId);
            if (node) this.renderSubTypeSelect(node.subType);
        }
        Toast.show(`已删除子类型"${st.name}"`, 'success');
    },

    refreshIfSelected(nodeId) {
        if (this.currentNodeId === nodeId) {
            this.showNodeProperty(nodeId);
        }
    },

    // ==================== 资源数量与可见性 ====================

    /**
     * 刷新资源节点的计算数值显示（属性面板中）
     */
    _refreshComputedQuantity(node) {
        const displayEl = document.getElementById('computed-qty-display');
        if (!displayEl) return;

        const project = DataStore.getCurrentProject();
        if (!project) return;

        const inputEdges = project.edges.filter(e => e.target === node.id && e.type === 'output');
        if (inputEdges.length === 0) {
            displayEl.textContent = '无输入连接';
            displayEl.style.fontStyle = 'italic';
            return;
        }

        let numericTotal = 0;
        let hasNumeric = false;
        const probItems = [];

        inputEdges.forEach(edge => {
            const srcNode = project.nodes.find(n => n.id === edge.source);
            if (!srcNode) return;
            const srcPort = (srcNode.outputPorts || []).find(p => p.id === edge.sourcePortId);
            const portType = srcPort?.portType || 'value';

            // 优先使用端口配置的 portValue
            let val = null;
            if (srcPort?.portValue != null) {
                if (portType === 'probability') {
                    val = srcPort.portValue;
                } else {
                    val = parseFloat(srcPort.portValue);
                    if (isNaN(val)) val = null;
                }
            } else {
                // 回退到边的数值
                if (edge.valueType === 'fixed' || !edge.valueType) {
                    val = parseFloat(edge.value);
                } else if (edge.valueType === 'range') {
                    val = `${edge.minValue || '?'}~${edge.maxValue || '?'}`;
                }
            }

            if (portType === 'probability') {
                probItems.push({ name: srcNode.name, portName: srcPort?.name || '', value: val });
            } else {
                hasNumeric = true;
                if (typeof val === 'number' && !isNaN(val)) numericTotal += val;
            }
        });

        // 构建显示文本
        if (hasNumeric && probItems.length > 0) {
            displayEl.innerHTML = `数值合计: <b>${numericTotal}</b><br><span style="font-size:11px;opacity:0.7">${probItems.map(p => `${p.portName||p.name}: ${p.value||'-'}`).join(' | ')}</span>`;
        } else if (hasNumeric) {
            displayEl.innerHTML = `数值合计: <b style="color:var(--primary);font-size:15px;">×${numericTotal}</b>`;
        } else if (probItems.length > 0) {
            displayEl.innerHTML = probItems.map(p =>
                `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(128,128,128,0.15);">
                    <span>${this.escapeHtml(p.portName || p.name)}</span>
                    <span style="font-weight:bold;">${p.value != null ? p.value : '-'}</span>
                 </div>`
            ).join('');
        }
        displayEl.style.fontStyle = 'normal';
    },

    updateResourceQuantity(value) {
        if (!this.currentNodeId) return;
        const numVal = value !== '' ? Number(value) : null;
        DataStore.updateResourceNodeVisibility(this.currentNodeId, true, numVal);
        Canvas.refresh();
        LeftPanel.renderResourceList();
        LeftPanel.renderResourceTypeList();
        Toast.show(numVal !== null ? '已配置数量，节点将在画布显示' : '已清除数量', 'success');
    },

    toggleResourceNodeVisibility(visible) {
        if (!this.currentNodeId) return;
        DataStore.updateResourceNodeVisibility(this.currentNodeId, visible, null);
        Canvas.refresh();
        Toast.show(visible ? '节点已在画布上显示' : '节点已从画布隐藏', 'info');
    },

    updateResourceColor(color) {
        if (!this.currentNodeId) return;
        DataStore.updateNode(this.currentNodeId, { nodeColor: color });
        document.getElementById('prop-input-res-color').value = color;
        Canvas.refresh();
    },

    // ==================== 资源类型关联信息面板 ====================

    /**
     * 显示资源类型编辑面板（点击左侧资源节点时调用）
     */
    showResourceTypeEdit(typeId) {
        const project = DataStore.getCurrentProject();
        if (!project) return;

        const resType = (project.customResourceTypes || []).find(t => t.id === typeId);
        if (!typeId || !resType) return;

        this.currentResTypeId = typeId;
        this.currentNodeId = null;
        this.currentEdgeId = null;

        // 隐藏其他面板
        document.getElementById('property-panel').classList.add('hidden');
        document.getElementById('node-property').classList.add('hidden');
        document.getElementById('edge-property').classList.add('hidden');
        document.getElementById('resource-type-info').classList.add('hidden');

        const panel = document.getElementById('resource-type-edit');
        panel.classList.remove('hidden');

        // 填充编辑数据
        document.getElementById('edit-res-type-id').value = typeId;
        document.getElementById('edit-res-type-name').value = resType.name || '';
        document.getElementById('edit-res-type-color').value = resType.color || '#f59e0b';
        document.getElementById('edit-res-type-title').textContent = resType.name;

        // 找出属于此类型的所有资源节点
        const resourceNodes = project.nodes.filter(n =>
            n.type === 'resource' && n.resourceType === typeId
        );
        const resourceIds = new Set(resourceNodes.map(n => n.id));

        // 分析边关系
        const outputFromNodes = [];   // 系统节点的 output → 此资源的 input（被产出自）
        const consumeByNodes = [];     // 此资源的 output → 系统节点的 input（被消耗于）

        project.edges.forEach(edge => {
            if (resourceIds.has(edge.target) && edge.type === 'output') {
                const srcNode = project.nodes.find(n => n.id === edge.source);
                if (srcNode && srcNode.type === 'system') {
                    outputFromNodes.push({ node: srcNode, edge: edge, targetResId: edge.target });
                }
            }
            if (resourceIds.has(edge.source) && edge.type === 'consume') {
                const tgtNode = project.nodes.find(n => n.id === edge.target);
                if (tgtNode && tgtNode.type === 'system') {
                    consumeByNodes.push({ node: tgtNode, edge: edge });
                }
            }
        });

        // 渲染统计卡片：实例数 / 产出来源 / 消耗去向
        const statsHtml = `
            <div class="rt-stat-item">
                <span class="rt-stat-num">${resourceNodes.length}</span>
                <span class="rt-stat-label">实例数</span>
            </div>
            <div class="rt-stat-item">
                <span class="rt-stat-num" style="color:var(--output-color)">${outputFromNodes.length}</span>
                <span class="rt-stat-label">产出来源</span>
            </div>
            <div class="rt-stat-item">
                <span class="rt-stat-num" style="color:var(--consume-color)">${consumeByNodes.length}</span>
                <span class="rt-stat-label">消耗去向</span>
            </div>`;
        document.getElementById('edit-rt-stats').innerHTML = statsHtml;

        // 渲染被产出自列表
        const outListEl = document.getElementById('edit-rt-output-list');
        if (outputFromNodes.length > 0) {
            outListEl.innerHTML = outputFromNodes.map(item => {
                const valStr = item.edge.valueType === 'fixed' ? item.edge.value :
                               item.edge.valueType === 'range' ? `${item.edge.minValue||'?'}-${item.edge.maxValue||'?'}` : '';
                return `
                <div class="rt-node-item output-rel" onclick="Canvas.selectNode('${item.node.id}');LeftPanel.focusNodeInCanvas('${item.node.id}')">
                    <div class="rt-node-icon system"><i class="fas fa-cubes"></i></div>
                    <span class="rt-node-name">${this.escapeHtml(item.node.name)}</span>
                    ${valStr ? `<span class="rt-node-val">${valStr}</span>` : ''}
                </div>`;
            }).join('');
        } else {
            outListEl.innerHTML = '<p class="placeholder-text" style="font-size:12px;">无产出来源</p>';
        }

        // 渲染被消耗于列表
        const consumeListEl = document.getElementById('edit-rt-consume-list');
        if (consumeByNodes.length > 0) {
            consumeListEl.innerHTML = consumeByNodes.map(item => {
                const valStr = item.edge.valueType === 'fixed' ? item.edge.value :
                               item.edge.valueType === 'range' ? `${item.edge.minValue||'?'}-${item.edge.maxValue||'?'}` : '';
                return `
                <div class="rt-node-item consume-rel" onclick="Canvas.selectNode('${item.node.id}');LeftPanel.focusNodeInCanvas('${item.node.id}')">
                    <div class="rt-node-icon system"><i class="fas fa-cubes"></i></div>
                    <span class="rt-node-name">${this.escapeHtml(item.node.name)}</span>
                    ${valStr ? `<span class="rt-node-val">${valStr}</span>` : ''}
                </div>`;
            }).join('');
        } else {
            consumeListEl.innerHTML = '<p class="placeholder-text" style="font-size:12px;">无消耗去向</p>';
        }

        // 渲染实例节点列表
        this._renderResTypeNodeList(resourceNodes, resType);
    },

    _renderResTypeNodeList(nodes, resType) {
        const listEl = document.getElementById('edit-res-type-nodes');
        if (!nodes.length) {
            listEl.innerHTML = '<p style="font-size:12px;color:var(--text-light);margin:0;padding:8px 0;">暂无实例节点</p>';
            return;
        }
        listEl.innerHTML = nodes.map(node => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;margin-bottom:4px;background:var(--bg-secondary);border-radius:6px;font-size:12px;cursor:pointer;border:1px solid transparent;"
                onmouseenter="this.style.borderColor='var(--primary)'"
                onmouseleave="this.style.borderColor='transparent'"
                onclick="Canvas.selectNode('${node.id}');LeftPanel.focusNodeInCanvas('${node.id}')">
                <span style="display:flex;align-items:center;gap:6px;">
                    <i class="fas fa-gem" style="color:${resType.color || '#f59e0b'};font-size:11px;"></i>
                    <span>${this.escapeHtml(node.name)}</span>
                </span>
                ${node.quantity != null ? `<span style="color:var(--text-light);">×${node.quantity}</span>` : ''}
            </div>
        `).join('');
    },

    updateResourceTypeName(name) {
        if (!this.currentResTypeId) return;
        const project = DataStore.getCurrentProject();
        const resType = (project.customResourceTypes || []).find(t => t.id === this.currentResTypeId);
        if (resType) {
            DataStore.pushHistory();
            const oldName = resType.name;
            resType.name = name;
            
            // 同步更新该类型下所有节点的名称
            const relatedNodes = project.nodes.filter(n => n.type === 'resource' && n.resourceType === this.currentResTypeId);
            let syncedCount = 0;
            let autoNameIndex = 1;
            relatedNodes.forEach(node => {
                if (node.name.startsWith(oldName)) {
                    // 前缀匹配：保留用户自定义后缀，只替换类型名前缀
                    node.name = name + node.name.substring(oldName.length);
                    syncedCount++;
                } else if (node.name.endsWith(' 实例') || node.name === oldName) {
                    // "货币实例" 或恰好等于旧类型名的 → 替换为新名字+实例
                    node.name = name + ' 实例';
                    syncedCount++;
                } else {
                    // 其他情况（如预设数据"金币""经验书"等）：统一用新类型名+实例+序号
                    node.name = name + ' 实例' + (autoNameIndex > 1 ? autoNameIndex : '');
                    autoNameIndex++;
                    syncedCount++;
                }
            });
            
            // 刷新面板：标题、统计卡片、实例列表
            document.getElementById('edit-res-type-title').textContent = name;
            this._renderResTypeNodeList(relatedNodes, resType);
            
            DataStore.save();
            Canvas.refresh();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show(`类型名称已更新为 "${name}"，${syncedCount} 个节点已同步`, 'success');
        }
    },

    setResourceTypeColor(color) {
        if (!this.currentResTypeId) return;
        const project = DataStore.getCurrentProject();
        const resType = (project.customResourceTypes || []).find(t => t.id === this.currentResTypeId);
        if (resType) {
            DataStore.pushHistory();
            resType.color = color;
            document.getElementById('edit-res-type-color').value = color;
            
            // 同步更新该类型下所有节点的 nodeColor
            project.nodes.filter(n => n.type === 'resource' && n.resourceType === this.currentResTypeId)
                .forEach(n => { n.nodeColor = color; });
            
            DataStore.save();
            Canvas.refresh();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show(`颜色已更新，${project.nodes.filter(n => n.type === 'resource' && n.resourceType === this.currentResTypeId).length} 个节点已同步`, 'success');
        }
    },

    deleteCurrentResourceType() {
        if (!this.currentResTypeId) return;
        const project = DataStore.getCurrentProject();
        const resType = (project.customResourceTypes || []).find(t => t.id === this.currentResTypeId);
        if (!resType) return;

        // 检查是否有使用此类型的节点
        const usedBy = project.nodes.filter(n => n.type === 'resource' && n.resourceType === this.currentResTypeId);
        
        let msg = `确定要删除资源类型"${resType.name}"吗？`;
        if (usedBy.length > 0) {
            msg += `\n（${usedBy.length} 个相关节点将变为"未分类"）`;
        }
        
        if (confirm(msg)) {
            DataStore.removeResourceType(this.currentResTypeId);
            this.currentResTypeId = null;
            PropertyPanel.showDefault();
            Canvas.refresh();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show('资源类型已删除', 'success');
        }
    },

    showResourceTypeInfo(typeId) {
        const project = DataStore.getCurrentProject();
        if (!project) return;

        // 隐藏其他面板
        document.getElementById('property-panel').classList.add('hidden');
        document.getElementById('node-property').classList.add('hidden');
        document.getElementById('edge-property').classList.add('hidden');
        document.getElementById('resource-type-edit').classList.add('hidden');
        
        const panel = document.getElementById('resource-type-info');
        panel.classList.remove('hidden');
        
        // 查找类型信息
        const resType = (project.customResourceTypes || []).find(t => t.id === typeId);
        const typeName = resType ? resType.name : typeId;
        
        document.getElementById('rtinfo-title').textContent = typeName;
        document.getElementById('rtinfo-badge').textContent = '资源类型';
        document.getElementById('rtinfo-badge').style.background = resType ? resType.color : 'var(--bg-primary)';
        
        // 找出属于此类型的所有资源节点
        const resourceNodes = project.nodes.filter(n =>
            n.type === 'resource' && n.resourceType === typeId
        );
        
        const resourceIds = new Set(resourceNodes.map(n => n.id));
        
        // 分析边关系：
        // 被产出自：系统节点的 output → 此资源的 input（type=output）
        // 被消耗于：此资源的 output → 系统节点的 input（type=consume，即source是此资源）
        const outputFromNodes = [];   // 哪些系统的output产出到此资源
        const consumeByNodes = [];     // 哪些系统消耗此资源的output
        
        project.edges.forEach(edge => {
            // 边的target是某个资源节点 → 该资源被 source 产出
            if (resourceIds.has(edge.target) && edge.type === 'output') {
                const srcNode = project.nodes.find(n => n.id === edge.source);
                if (srcNode && srcNode.type === 'system') {
                    outputFromNodes.push({ node: srcNode, edge: edge, targetResId: edge.target });
                }
            }
            
            // 边的source是某个资源节点且type=consume → 该资源被 target 消耗
            if (resourceIds.has(edge.source) && edge.type === 'consume') {
                const tgtNode = project.nodes.find(n => n.id === edge.target);
                if (tgtNode && tgtNode.type === 'system') {
                    consumeByNodes.push({ node: tgtNode, edge: edge });
                }
            }
        });

        // 渲染统计
        const statsHtml = `
            <div class="rt-stat-item">
                <span class="rt-stat-num">${resourceNodes.length}</span>
                <span class="rt-stat-label">实例数</span>
            </div>
            <div class="rt-stat-item">
                <span class="rt-stat-num" style="color:var(--output-color)">${outputFromNodes.length}</span>
                <span class="rt-stat-label">产出来源</span>
            </div>
            <div class="rt-stat-item">
                <span class="rt-stat-num" style="color:var(--consume-color)">${consumeByNodes.length}</span>
                <span class="rt-stat-label">消耗去向</span>
            </div>`;
        document.getElementById('rt-stats').innerHTML = statsHtml;

        // 渲染产出列表
        const outListEl = document.getElementById('rtinfo-output-list');
        if (outputFromNodes.length > 0) {
            outListEl.innerHTML = outputFromNodes.map(item => {
                const valStr = item.edge.valueType === 'fixed' ? item.edge.value :
                               item.edge.valueType === 'range' ? `${item.edge.minValue||'?'}-${item.edge.maxValue||'?'}` :
                               '';
                return `
                <div class="rt-node-item output-rel" onclick="Canvas.selectNode('${item.node.id}');LeftPanel.focusNodeInCanvas('${item.node.id}')">
                    <div class="rt-node-icon system"><i class="fas fa-cubes"></i></div>
                    <span class="rt-node-name">${this.escapeHtml(item.node.name)}</span>
                    ${valStr ? `<span class="rt-node-val">${valStr}</span>` : ''}
                </div>`;
            }).join('');
        } else {
            outListEl.innerHTML = '<p class="placeholder-text" style="font-size:12px;">无产出来源</p>';
        }

        // 渲染消耗列表
        const consumeListEl = document.getElementById('rtinfo-consume-list');
        if (consumeByNodes.length > 0) {
            consumeListEl.innerHTML = consumeByNodes.map(item => {
                const valStr = item.edge.valueType === 'fixed' ? item.edge.value :
                               item.edge.valueType === 'range' ? `${item.edge.minValue||'?'}-${item.edge.maxValue||'?'}` :
                               '';
                return `
                <div class="rt-node-item consume-rel" onclick="Canvas.selectNode('${item.node.id}');LeftPanel.focusNodeInCanvas('${item.node.id}')">
                    <div class="rt-node-icon system"><i class="fas fa-cubes"></i></div>
                    <span class="rt-node-name">${this.escapeHtml(item.node.name)}</span>
                    ${valStr ? `<span class="rt-node-val">${valStr}</span>` : ''}
                </div>`;
            }).join('');
        } else {
            consumeListEl.innerHTML = '<p class="placeholder-text" style="font-size:12px;">无消耗去向</p>';
        }
    },
};

// ==================== 资源分析模块 ====================
const Analysis = {
    mode: 'all',
    selectedResourceId: null,

    init() {
        this.renderResourceList();
        this.bindEvents();
        
        // 自动选中第一个资源
        const project = DataStore.getCurrentProject();
        if (project) {
            const firstResource = project.nodes.find(n => n.type === 'resource');
            if (firstResource) {
                // 延迟执行确保DOM已渲染
                setTimeout(() => this.selectResource(firstResource.id), 100);
            }
        }
    },

    bindEvents() {
        // 分析画布初始化（简化版）
    },

    setMode(mode) {
        this.mode = mode;
        
        document.querySelectorAll('.analysis-toolbar .btn-toggle').forEach((btn, i) => {
            const modes = ['all', 'output', 'consume'];
            btn.classList.toggle('active', modes[i] === mode);
        });
        
        this.refreshView();
    },

    filterByType(type) {
        this.selectedResourceId = null;
        this.renderResourceList();
    },

    searchResource(query) {
        this.renderResourceList(query);
    },

    renderResourceList(searchQuery) {
        const container = document.getElementById('analysis-resource-list');
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        let resources = project.nodes.filter(n => n.type === 'resource');
        
        // 类型筛选
        const typeFilter = document.getElementById('analysis-resource-type')?.value;
        if (typeFilter && typeFilter !== 'all') {
            resources = resources.filter(r => r.resourceType === typeFilter);
        }
        
        // 搜索筛选
        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            resources = resources.filter(r => r.name.toLowerCase().includes(q));
        }
        
        if (resources.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:13px;">暂无匹配资源</div>';
            return;
        }
        
        container.innerHTML = resources.map(res => `
            <div class="analysis-resource-item ${this.selectedResourceId === res.id ? 'active' : ''}" 
                 data-res-id="${res.id}" onclick="Analysis.selectResource('${res.id}')">
                <div class="resource-icon ${res.resourceType}" style="width:28px;height:28px;font-size:12px;">
                    <i class="fas ${res.resourceType === 'currency' ? 'fa-coins' : res.resourceType === 'material' ? 'fa-gem' : 'fa-bolt'}"></i>
                </div>
                <span>${LeftPanel.escapeHtml(res.name)}</span>
            </div>
        `).join('');
    },

    selectResource(resourceId) {
        this.selectedResourceId = resourceId;
        
        // 更新列表选中状态
        document.querySelectorAll('.analysis-resource-item').forEach(item => {
            item.classList.toggle('active', item.dataset.resId === resourceId);
        });
        
        this.renderGraph(resourceId);
        this.renderDetail(resourceId);
    },

    renderGraph(resourceId) {
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        const edgesLayer = document.getElementById('analysis-edges-layer');
        const nodesLayer = document.getElementById('analysis-nodes-layer');
        
        edgesLayer.innerHTML = '';
        nodesLayer.innerHTML = '';
        document.querySelectorAll('.analysis-canvas .analysis-node, .analysis-canvas .analysis-edge-label').forEach(el => el.remove());
        
        const resource = project.nodes.find(n => n.id === resourceId);
        if (!resource) return;
        
        // 找出与该资源相关的边和节点
        const relatedEdges = project.edges.filter(e => e.source === resourceId || e.target === resourceId);
        
        // 来源节点（产出该资源的系统）
        const sourceIds = [...new Set(relatedEdges.filter(e => e.target === resourceId && e.type === 'output').map(e => e.source))];
        // 目标节点（消耗该资源的系统）
        const targetIds = [...new Set(relatedEdges.filter(e => e.source === resourceId && e.type === 'consume').map(e => e.target))];
        
        // 筛选
        if (this.mode === 'output') targetIds.length = 0;
        if (this.mode === 'consume') sourceIds.length = 0;
        
        const sourceNodes = sourceIds.map(id => project.nodes.find(n => n.id === id)).filter(Boolean);
        const targetNodes = targetIds.map(id => project.nodes.find(n => n.id === id)).filter(Boolean);
        
        // 布局：中心是资源，周围是来源和目标
        const centerX = 400;
        const centerY = 250;
        const radius = 180;
        
        // 渲染中心资源节点
        const analysisCanvas = document.querySelector('.analysis-canvas .canvas-container');
        if (!analysisCanvas) return;
        
        const centerNodeEl = document.createElement('div');
        centerNodeEl.className = 'analysis-node center';
        centerNodeEl.style.left = (centerX - 70) + 'px';
        centerNodeEl.style.top = (centerY - 24) + 'px';
        centerNodeEl.innerHTML = `
            <div class="node-title">${LeftPanel.escapeHtml(resource.name)}</div>
            <div class="node-desc">中心资源</div>
        `;
        analysisCanvas.appendChild(centerNodeEl);
        
        // 渲染来源节点
        sourceNodes.forEach((node, i) => {
            const angle = (Math.PI * 2 * i / Math.max(sourceNodes.length, 1)) - Math.PI/2;
            const x = centerX + Math.cos(angle) * radius - 55;
            const y = centerY + Math.sin(angle) * radius - 20;
            
            const el = document.createElement('div');
            el.className = 'analysis-node source';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.innerHTML = `<div class="node-title">${LeftPanel.escapeHtml(node.name)}</div>`;
            analysisCanvas.appendChild(el);
            
            // 绘制连线（来源->中心）
            this.drawAnalysisLine(x + 110, y + 20, centerX, centerY, 'source', 
                relatedEdges.find(e => e.source === node.id && e.target === resourceId));
        });
        
        // 渲染目标节点
        targetNodes.forEach((node, i) => {
            const angle = (Math.PI * 2 * i / Math.max(targetNodes.length, 1)) + Math.PI/2;
            const x = centerX + Math.cos(angle) * radius - 55;
            const y = centerY + Math.sin(angle) * radius - 20;
            
            const el = document.createElement('div');
            el.className = 'analysis-node target';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.innerHTML = `<div class="node-title">${LeftPanel.escapeHtml(node.name)}</div>`;
            analysisCanvas.appendChild(el);
            
            // 绘制连线（中心->目标）
            this.drawAnalysisLine(centerX, centerY, x + 110, y + 20, 'target',
                relatedEdges.find(e => e.source === resourceId && e.target === node.id));
        });
        
        if (sourceNodes.length === 0 && targetNodes.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--text-light);font-size:14px;';
            emptyEl.textContent = '该资源暂无关联关系';
            analysisCanvas.appendChild(emptyEl);
        }
    },

    drawAnalysisLine(x1, y1, x2, y2, direction, edgeInfo) {
        const edgesLayer = document.getElementById('analysis-edges-layer');
        if (!edgesLayer) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', direction === 'source' ? '#22c55e' : '#ef4444');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', direction === 'source' ? 'url(#analysis-arrow-source)' : 'url(#analysis-arrow-target)');
        line.setAttribute('stroke-dasharray', '6,4');
        document.getElementById('analysis-edges-layer').appendChild(line);
        
        // 边标签
        if (edgeInfo) {
            const analysisCanvas2 = document.querySelector('.analysis-canvas .canvas-container');
            if (!analysisCanvas2) return;
            const label = document.createElement('div');
            label.className = 'edge-label';
            label.style.left = ((x1+x2)/2) + 'px';
            label.style.top = ((y1+y2)/2) + 'px';
            let text = direction === 'source' ? '产出' : '消耗';
            if (edgeInfo.valueType === 'fixed' && edgeInfo.value) text += ` ${edgeInfo.value}`;
            else if (edgeInfo.valueType === 'range') text += ` ${edgeInfo.minValue||'?'}-${edgeInfo.maxValue||'?'}`;
            label.textContent = text;
            label.classList.add(direction === 'source' ? 'output' : 'consume');
            analysisCanvas2.appendChild(label);
        }
    },

    renderDetail(resourceId) {
        const container = document.getElementById('analysis-resource-info');
        const project = DataStore.getCurrentProject();
        if (!project) return;
        
        const resource = project.nodes.find(n => n.id === resourceId);
        if (!resource) return;
        
        const edges = project.edges.filter(e => e.source === resourceId || e.target === resourceId);
        const sourceEdges = edges.filter(e => e.target === resourceId && e.type === 'output');
        const targetEdges = edges.filter(e => e.source === resourceId && e.type === 'consume');
        
        const types = { currency: '货币', material: '养成材料', stamina: '体力类' };
        const rarities = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
        
        container.innerHTML = `
            <div class="analysis-info-section">
                <h4><i class="fas fa-info-circle"></i> 基本信息</h4>
                <p><strong>名称：</strong>${LeftPanel.escapeHtml(resource.name)}</p>
                <p><strong>类型：</strong>${types[resource.resourceType] || '-'}</p>
                <p><strong>稀有度：</strong>${rarities[resource.rarity] || '-'}</p>
                ${resource.description ? `<p><strong>描述：</strong>${LeftPanel.escapeHtml(resource.description)}</p>` : ''}
            </div>
            <div class="analysis-info-section">
                <h4><i class="fas fa-arrow-down source-icon"></i> 来源系统 (${sourceEdges.length})</h4>
                ${sourceEdges.length > 0 ? sourceEdges.map(e => {
                    const src = project.nodes.find(n => n.id === e.source);
                    return `<div class="analysis-source-item">
                        <i class="fas fa-plus-circle source-icon"></i>
                        <span>${src ? src.name : '未知'}</span>
                        <span style="margin-left:auto;color:var(--text-light);font-size:12px;">
                            ${e.valueType === 'fixed' ? e.value : `${e.minValue||'?'}-${e.maxValue||'?'}`
                        }</span>
                    </div>`;
                }).join('') : '<p style="color:var(--text-light);font-size:13px;">暂无来源</p>'}
            </div>
            <div class="analysis-info-section">
                <h4><i class="fas fa-arrow-up target-icon"></i> 消耗系统 (${targetEdges.length})</h4>
                ${targetEdges.length > 0 ? targetEdges.map(e => {
                    const tgt = project.nodes.find(n => n.id === e.target);
                    return `<div class="analysis-target-item">
                        <i class="fas fa-minus-circle target-icon"></i>
                        <span>${tgt ? tgt.name : '未知'}</span>
                        <span style="margin-left:auto;color:var(--text-light);font-size:12px;">
                            ${e.valueType === 'fixed' ? e.value : `${e.minValue||'?'}-${e.maxValue||'?'}`
                        }</span>
                    </div>`;
                }).join('') : '<p style="color:var(--text-light);font-size:13px;">暂无消耗</p>'}
            </div>
        `;
    },

    refreshView() {
        if (this.selectedResourceId) {
            this.renderGraph(this.selectedResourceId);
            this.renderDetail(this.selectedResourceId);
        }
    },

    goBack() {
        App.showPage('editor');
    }
};

// ==================== 模态框模块 ====================
const Modal = {
    currentModal: null,
    modalData: null,

    open(name, data = {}) {
        this.currentModal = name;
        this.modalData = data;
        
        const modal = document.getElementById(`modal-${name}`);
        if (modal) {
            modal.classList.remove('hidden');
            
            // 清空输入
            const inputs = modal.querySelectorAll('input, textarea');
            inputs.forEach(el => {
                if (el.type !== 'checkbox') el.value = '';
            });
            
            // 特殊处理：系统模态框填充父级选项列表
            if (name === 'system') {
                const parentSelect = document.getElementById('input-system-parent');
                const defaultParentId = data.defaultParentId || null;

                parentSelect.innerHTML = '<option value="">无（根级）</option>';
                const project = DataStore.getCurrentProject();
                if (project) {
                    project.nodes.filter(n => n.type === 'system').forEach(n => {
                        const opt = document.createElement('option');
                        opt.value = n.id;
                        opt.textContent = n.name;
                        parentSelect.appendChild(opt);
                    });

                    // 预设父节点
                    if (defaultParentId) {
                        parentSelect.value = defaultParentId;
                    }
                    
                    // 填充子类型选择器（从项目自定义列表）
                    this._populateSubTypeSelect('input-system-subtype', project);
                }

                // 聚焦到名称输入框
                setTimeout(() => {
                    document.getElementById('input-system-name').focus();
                }, 100);
            }

            // 编辑系统模态框：预填充当前节点数据
            if (name === 'system-edit') {
                const nodeId = data.nodeId;
                const project = DataStore.getCurrentProject();
                const node = project?.nodes.find(n => n.id === nodeId);
                if (!node) return;

                document.getElementById('edit-system-node-id').value = node.id;
                document.getElementById('edit-system-name').value = node.name || '';
                document.getElementById('edit-system-level').value = node.level || 1;
                document.getElementById('edit-system-desc').value = node.description || '';
                document.getElementById('edit-system-subtype').value = node.subType || '';

                // 从项目自定义子类型列表填充选择器
                this._populateSubTypeSelect('edit-system-subtype', project);

                // 填充父级列表（排除自身及后代）
                const parentSelect = document.getElementById('edit-system-parent');
                parentSelect.innerHTML = '<option value="">无（根节点）</option>';
                if (project) {
                    // 收集自身及所有后代ID，排除掉
                    const excludeIds = new Set([nodeId]);
                    let queue = [nodeId];
                    while (queue.length > 0) {
                        const pid = queue.shift();
                        project.nodes.forEach(n => {
                            if (n.parentId === pid && !excludeIds.has(n.id)) {
                                excludeIds.add(n.id);
                                queue.push(n.id);
                            }
                        });
                    }
                    project.nodes.filter(n => n.type === 'system' && !excludeIds.has(n.id)).forEach(n => {
                        const opt = document.createElement('option');
                        opt.value = n.id;
                        opt.textContent = n.name;
                        parentSelect.appendChild(opt);
                    });
                    parentSelect.value = node.parentId || '';
                }

                setTimeout(() => {
                    document.getElementById('edit-system-name').focus();
                    document.getElementById('edit-system-name').select();
                }, 100);
            }
            
            if (name === 'resource') {
                setTimeout(() => {
                    document.getElementById('input-resource-name').focus();
                }, 100);
            }
        }
    },

    close(name) {
        const modal = document.getElementById(`modal-${name || this.currentModal}`);
        if (modal) modal.classList.add('hidden');
        this.currentModal = null;
        this.modalData = null;
    },

    /**
     * 用项目的自定义子类型列表填充子类型选择器
     */
    _populateSubTypeSelect(selectId, project) {
        const select = document.getElementById(selectId);
        if (!select || !project) return;
        
        const subTypes = project.customSubTypes || [
            { id: 'normal', name: '普通' },
            { id: 'key', name: '关键' },
            { id: 'daily', name: '日常' },
            { id: 'weekly', name: '周常' }
        ];
        
        const currentVal = select.value;
        select.innerHTML = '<option value="">无</option>' +
            subTypes.map(st => `<option value="${st.id}">${st.name}</option>`).join('');
        // 恢复之前选中的值（如果还在列表中）
        if (subTypes.some(s => s.id === currentVal)) {
            select.value = currentVal;
        }
    },

    confirmProject() {
        const name = document.getElementById('input-project-name').value.trim();
        if (!name) {
            Toast.show('请输入项目名称', 'warning');
            return;
        }
        
        const desc = document.getElementById('input-project-desc').value.trim();
        const project = DataStore.createProject(name, desc);
        
        this.close('project');
        App.openEditor(project.id);
        Toast.show('项目创建成功', 'success');
    },

    confirmSystem() {
        try {
            const name = document.getElementById('input-system-name').value.trim();
            if (!name) {
                Toast.show('请输入系统名称', 'warning');
                return;
            }
            
            // 检查是否在编辑器中有当前项目
            const project = DataStore.getCurrentProject();
            if (!project) {
                Toast.show('请先进入一个项目', 'warning');
                return;
            }
            
            const parentId = document.getElementById('input-system-parent').value || null;
            const subType = document.getElementById('input-system-subtype').value;
            
            const node = DataStore.addNode({
                name,
                type: 'system',
                parentId,
                subType,
                level: parentId ? 2 : 1,
                x: 300 + Math.random() * 200,
                y: 200 + Math.random() * 150,
                tags: [],
                description: ''
            });
            
            if (!node) {
                Toast.show('创建失败，请重试', 'error');
                return;
            }
            
            this.close('system');
            
            Canvas.render(project);
            LeftPanel.renderSystemTree();
            
            Canvas.selectNode(node.id);
            
            Toast.show(`系统"${name}"创建成功`, 'success');
        } catch (e) {
            console.error('[confirmSystem] 异常:', e);
            Toast.show('创建出错: ' + e.message, 'error');
        }
    },

    confirmSystemEdit() {
        try {
            const nodeId = document.getElementById('edit-system-node-id').value;
            const name = document.getElementById('edit-system-name').value.trim();
            if (!name) {
                Toast.show('请输入系统名称', 'warning');
                return;
            }

            const project = DataStore.getCurrentProject();
            if (!project) return;

            const node = project.nodes.find(n => n.id === nodeId);
            if (!node) return;

            const parentId = document.getElementById('edit-system-parent').value || null;
            const subType = document.getElementById('edit-system-subtype').value;
            const level = parseInt(document.getElementById('edit-system-level').value) || 1;
            const description = document.getElementById('edit-system-desc').value.trim();

            DataStore.pushHistory();
            DataStore.updateNode(nodeId, {
                name,
                parentId,
                subType,
                level,
                description
            });

            this.close('system-edit');

            Canvas.refresh();
            LeftPanel.renderSystemTree();

            // 更新属性面板（如果正在显示该节点）
            PropertyPanel.refreshIfSelected(nodeId);

            Toast.show(`系统"${name}"已更新`, 'success');
        } catch (e) {
            console.error('[confirmSystemEdit] 异常:', e);
            Toast.show('保存出错: ' + e.message, 'error');
        }
    },

    confirmResource() {
        try {
            const name = document.getElementById('input-resource-name').value.trim();
            if (!name) {
                Toast.show('请输入资源名称', 'warning');
                return;
            }
            
            // 检查是否在编辑器中有当前项目
            const project = DataStore.getCurrentProject();
            if (!project) {
                Toast.show('请先进入一个项目', 'warning');
                return;
            }
            
            const resourceType = document.getElementById('input-resource-type').value;
            const rarity = document.getElementById('input-resource-rarity').value;
            const desc = document.getElementById('input-resource-desc').value.trim();
            
            const node = DataStore.addNode({
                name,
                type: 'resource',
                resourceType,
                rarity,
                x: 200 + Math.random() * 400,
                y: 350 + Math.random() * 100,
                tags: [],
                description: desc
            });
            
            if (!node) {
                Toast.show('创建失败，请重试', 'error');
                return;
            }
            
            this.close('resource');
            
            Canvas.render(project);
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            
            Canvas.selectNode(node.id);
            
            Toast.show(`资源"${name}"创建成功`, 'success');
        } catch (e) {
            console.error('[confirmResource] 异常:', e);
            Toast.show('创建出错: ' + e.message, 'error');
        }
    },

    confirmResourceType() {
        try {
            const name = document.getElementById('input-rtype-name').value.trim();
            if (!name) {
                Toast.show('请输入类型名称', 'warning');
                return;
            }

            const project = DataStore.getCurrentProject();
            if (!project) return;

            const icon = document.getElementById('input-rtype-icon').value;
            const color = document.getElementById('input-rtype-color').value;

            const result = DataStore.addResourceType({ name, icon, color });
            if (!result) return; // 已存在

            this.close('resource-type');

            LeftPanel.renderResourceTypeList();

            Toast.show(`资源类型"${name}"创建成功，可拖拽到画布`, 'success');
        } catch (e) {
            console.error('[confirmResourceType] 异常:', e);
            Toast.show('创建出错: ' + e.message, 'error');
        }
    }
};

// ==================== 右键菜单模块 ====================
const ContextMenu = {
    contextData: null,

    show(x, y, data) {
        this.contextData = data;
        const menu = document.getElementById('context-menu');
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        
        // 确保菜单不超出屏幕
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
    },

    hide() {
        document.getElementById('context-menu').classList.add('hidden');
        this.contextData = null;
    },

    action(actionName) {
        const data = this.contextData;
        this.hide();
        
        switch(actionName) {
            case 'edit':
                if (data?.type === 'node') {
                    Canvas.selectNode(data.id);
                } else if (data?.type === 'edge') {
                    Canvas.selectEdge(data.id);
                }
                break;
                
            case 'connect':
                if (data?.type === 'node') {
                    Canvas.enterConnectMode(data.id);
                } else {
                    Canvas.enterConnectMode();
                }
                break;
                
            case 'delete':
                if (data?.type === 'node') {
                    PropertyPanel.currentNodeId = data.id;
                    PropertyPanel.deleteCurrentNode();
                } else if (data?.type === 'edge') {
                    PropertyPanel.currentEdgeId = data.id;
                    PropertyPanel.deleteCurrentEdge();
                }
                break;
        }
    }
};

// 点击其他地方关闭右键菜单
document.addEventListener('click', () => {
    ContextMenu.hide();
    LeftPanel.hideTreeContextMenu();
});

// ESC关闭模态框
document.addEventListener('keydown', (e) => {
    // 如果焦点在输入框中，不处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'Escape') {
        // 关闭模态框
        document.querySelectorAll('.modal:not(.hidden)').forEach(m => m.classList.add('hidden'));
        // 退出连线模式
        Canvas.exitConnectMode();
    }
    
    // 编辑器页面快捷键
    const editorPage = document.getElementById('page-editor');
    if (!editorPage || !editorPage.classList.contains('active')) return;
    
    // Ctrl+Z 撤销 (Shift+Ctrl+Z 重做)
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        Editor.undo();
    }
    if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        Editor.redo();
    }
    // Ctrl+Y 重做
    if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        Editor.redo();
    }
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        Editor.saveProject();
    }
    // Ctrl+D 删除选中节点/边
    if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey) {
        if (Canvas.selectedNode) PropertyPanel.deleteCurrentNode();
        else if (Canvas.selectedEdge) PropertyPanel.deleteCurrentEdge();
    }
    // L 键自动布局
    if (e.key === 'l' && !e.ctrlKey) {
        Canvas.autoLayout();
    }
    // R 键重置视图
    if (e.key === 'r' && !e.ctrlKey) {
        Canvas.resetView();
    }
});

// ==================== Toast 提示模块 ====================
const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
        container.appendChild(toast);
        
        // 自动消失
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// ==================== 应用启动 ====================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 全局错误捕获
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JS错误:', msg, 'at', lineNo);
    return false;
};
