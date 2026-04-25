/**
 * 游戏资源流向蓝图工具 - 画布模块
 * 负责 SVG/HTML 混合渲染、缩放平移、拖拽、连线、小地图等核心功能
 */
const Canvas = {
    // ==================== DOM 引用 ====================
    container: null,
    svg: null,
    edgesLayer: null,
    nodesLayer: null,
    overlay: null,
    miniMapCanvas: null,

    // ==================== 视图变换参数 ====================
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    minScale: 0.1,
    maxScale: 3,

    // ==================== 交互状态 ====================
    isDragging: false,
    isPanning: false,
    isConnecting: false,
    connectSource: null,
    connectSourcePort: null,
    dragNode: null,
    dragStartX: 0,
    dragStartY: 0,
    dragNodeStartX: 0,
    dragNodeStartY: 0,
    panStartX: 0,
    panStartY: 0,
    mouseDownTime: 0,

    // ==================== 选择状态 ====================
    selectedNode: null,
    selectedEdge: null,

    // ==================== 筛选条件 ====================
    filters: {
        showSystemNodes: true,
        showResourceNodes: true,
        showOutputEdges: true,
        showConsumeEdges: true,
        searchQuery: ''
    },

    // ==================== 常量配置 ====================
    NODE_WIDTH: 140,
    PORT_RADIUS: 6,

    // ==================== 布局常量（与HTML结构完全匹配） ====================
    HEADER_BAR_H: 6,       // 顶部颜色横条高度
    PORT_AREA_H: 22,       // 底部端口区域高度  
    NAME_MIN_H: 18,        // 名称区域最小高度

    // ==================== 辅助方法 ====================
    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // 计算节点总高度 = 顶栏 + 名称区 + 端口区
    calcNodeHeight(node) {
        return this.HEADER_BAR_H + this.NAME_MIN_H + this.PORT_AREA_H;  // 46px
    },

    // 获取分组颜色（父节点的parentColor）
    getGroupColor(node, project) {
        if (node.parentId) {
            const parent = project.nodes.find(n => n.id === node.parentId);
            return parent?.parentColor || '#3b82f6';
        }
        return node.parentColor || '#3b82f6';
    },

    // 获取边框颜色（角色边框颜色）
    getBorderColor(node, project) {
        if (node.parentId) {
            const parent = project.nodes.find(n => n.id === node.parentId);
            return parent?.roleColor || 'var(--border-color)';
        }
        return node.roleColor || 'var(--border-color)';
    },

    // ==================== 初始化 ====================
    init() {
        this.container = document.getElementById('canvas-container');
        this.svg = document.getElementById('canvas-svg');
        this.edgesLayer = document.getElementById('edges-layer');
        this.nodesLayer = document.getElementById('nodes-layer');
        this.overlay = document.getElementById('nodes-overlay');
        this.miniMapCanvas = document.getElementById('mini-map-canvas');

        this.bindEvents();
        console.log('[Canvas] 初始化完成');
    },

    // ==================== 事件绑定 ====================
    bindEvents() {
        this.container.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.container.addEventListener('dragover', (e) => e.preventDefault());
        this.container.addEventListener('drop', (e) => this.onDrop(e));
    },

    onWheel(e) {
        e.preventDefault();
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * delta));
        if (newScale === this.scale) return;
        const zoomRatio = newScale / this.scale;
        this.offsetX = mouseX - (mouseX - this.offsetX) * zoomRatio;
        this.offsetY = mouseY - (mouseY - this.offsetY) * zoomRatio;
        this.scale = newScale;
        this.updateTransform();
        this.updateZoomDisplay();
    },

    onMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' ||
            e.target.closest('.node-card') || e.target.closest('.modal') ||
            e.target.closest('.context-menu') || e.target.closest('.tree-context-menu')) {
            return;
        }
        this.mouseDownTime = Date.now();

        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isPanning = true;
            this.panStartX = e.clientX - this.offsetX;
            this.panStartY = e.clientY - this.offsetY;
            this.container.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        if (e.button === 0) {
            const targetTag = e.target.tagName;
            const targetClass = e.target.classList;

            if ((targetTag === 'svg' || targetTag === 'g' || e.target.id === 'edges-layer' ||
                e.target.id === 'nodes-layer' || targetClass.contains('canvas-svg') ||
                targetClass.contains('canvas-container'))) {
                this.isPanning = true;
                this.panStartX = e.clientX - this.offsetX;
                this.panStartY = e.clientY - this.offsetY;
                this.container.style.cursor = 'grabbing';
                this.selectNode(null);
                this.selectEdge(null);
                this.clearHighlights();
                PropertyPanel.showDefault();
            }
        }
    },

    onMouseMove(e) {
        if (this.isPanning) {
            this.offsetX = e.clientX - this.panStartX;
            this.offsetY = e.clientY - this.panStartY;
            this.updateTransform();
            return;
        }
        if (this.isDragging && this.dragNode) {
            const dx = (e.clientX - this.dragStartX) / this.scale;
            const dy = (e.clientY - this.dragStartY) / this.scale;
            DataStore.updateNodePosition(this.dragNode,
                this.dragNodeStartX + dx,
                this.dragNodeStartY + dy
            );
            this.refresh();
            this.updateMiniMap();
        }
    },

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.container.style.cursor = '';
        }
        if (this.isDragging && this.dragNode) {
            this.isDragging = false;
            DataStore.batchUpdatePositions([{ id: this.dragNode, x: null, y: null }].map(item => {
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === item.id);
                return node ? { id: node.id, x: node.x, y: node.y } : item;
            }).filter(Boolean));
            this.dragNode = null;
        }
    },

    onDrop(e) {
        e.preventDefault();
        const typeId = e.dataTransfer.getData('new-resource-type-id');
        const typeName = e.dataTransfer.getData('new-resource-type-name');
        if (!typeId) return;

        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.offsetX) / this.scale;
        const y = (e.clientY - rect.top - this.offsetY) / this.scale;

        const project = DataStore.getCurrentProject();
        if (!project) return;

        const resType = project.customResourceTypes?.find(t => t.id === typeId);
        const node = DataStore.addResourceNode(`${typeName}_实例`, typeId);

        if (node) {
            node.x = x - 70;
            node.y = y - 20;
            DataStore.save();
            Canvas.refresh();
            LeftPanel.renderResourceList();
            LeftPanel.renderResourceTypeList();
            Toast.show(`已添加 ${typeName} 节点`, 'success');
        }
    },

    // ==================== 变换与视图 ====================
    updateTransform() {
        this.svg.style.transformOrigin = '0 0';
        this.svg.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.overlay.style.transformOrigin = '0 0';
        this.overlay.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    },

    resetView() {
        this.scale = 1;
        this.offsetX = 50;
        this.offsetY = 30;
        this.selectedNode = null;
        this.selectedEdge = null;
        this.updateTransform();
        this.updateZoomDisplay();
        this.refresh();
    },

    updateZoomDisplay() {
        const el = document.getElementById('zoom-level');
        if (el) el.innerHTML = `<i class="fas fa-search-plus"></i> 缩放 ${Math.round(this.scale * 100)}%`;
    },

    // ==================== 渲染入口 ====================
    render(project) {
        if (!project) return;
        this.resetView();
        this._renderAll(project);
    },

    refresh() {
        const project = DataStore.getCurrentProject();
        if (!project) return;
        this._renderAll(project);
    },

    /**
     * 核心渲染流程：
     * 1. 先渲染节点到 overlay（DOM）
     * 2. 从DOM读取端口真实像素位置（getBoundingClientRect）
     * 3. 用真实坐标绘制连线 → 像素级精确对齐！
     */
    _renderAll(project) {
        // 第一步：先渲染节点到DOM
        this._renderNodesOverlay(project);

        // 第二步：从DOM读取端口真实位置，再画连线
        this._renderEdgesWithRealPositions(project);

        this._updateStatusBar(project);
        this.updateMiniMap();
    },

    // ==================== 使用DOM真实端口位置画连线 ====================
    _renderEdgesWithRealPositions(project) {
        const portCache = this._buildPortPositionCache();
        let html = '';

        for (const edge of project.edges) {
            if (!this._shouldShowEdge(edge)) continue;

            const sourceNode = project.nodes.find(n => n.id === edge.source);
            const targetNode = project.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) continue;
            if (!this._shouldShowNode(sourceNode) || !this._shouldShowNode(targetNode)) continue;

            // 使用DOM真实位置，回退到计算值
            const sp = this._resolvePortPos(sourceNode, edge.sourcePortId, 'output', portCache);
            const tp = this._resolvePortPos(targetNode, edge.targetPortId, 'input', portCache);

            const color = this._getEdgeColor(edge);
            const isSelected = this.selectedEdge === edge.id;
            const strokeWidth = isSelected ? 3 : 2;
            const path = this._calcEdgePath(sp.x, sp.y, tp.x, tp.y);

            html += `<path class="edge-element${isSelected ? ' selected' : ''}" d="${path}" stroke="${color}" stroke-width="${strokeWidth}"
                      fill="none" marker-end="url(#arrow-${edge.type || 'default'})"
                      data-edge-id="${edge.id}"
                      style="cursor:pointer;" onclick="Canvas.selectEdge('${edge.id}')"
                      oncontextmenu="Canvas._onEdgeContextMenu(event, '${edge.id}')"/>`;

            const valueLabel = this._getEdgeValueLabel(edge);
            if (valueLabel) {
                const mx = (sp.x + tp.x) / 2;
                const my = (sp.y + tp.y) / 2;
                html += `<text x="${mx}" y="${my - 8}" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold" style="pointer-events:none;">${valueLabel}</text>`;
            }
        }

        // 连线预览线
        if (this.isConnecting && this.connectSource) {
            const srcNode = project.nodes.find(n => n.id === this.connectSource);
            if (srcNode) {
                const sp = this._resolvePortPos(srcNode, this.connectSourcePort, 'output', portCache);
                const tx = (this._tempMouseX || 0);
                const ty = (this._tempMouseY || 0);
                const path = this._calcEdgePath(sp.x, sp.y, tx, ty);
                html += `<path class="edge-element" d="${path}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4"
                          fill="none" marker-end="url(#arrow-default)" style="pointer-events:none;" />`;
            }
        }

        this.edgesLayer.innerHTML = html;
    },

    /** 扫描所有 .port 元素，构建 nodeId-direction-index → {x,y} 缓存 */
    _buildPortPositionCache() {
        const cache = {};
        const containerRect = this.container.getBoundingClientRect();

        this.overlay.querySelectorAll('.port').forEach(portEl => {
            const nodeId = portEl.dataset.nodeId;
            const direction = portEl.dataset.direction;
            const rect = portEl.getBoundingClientRect();

            // 屏幕像素坐标 → 画布逻辑坐标
            const cx = (rect.left + rect.width / 2 - containerRect.left) / this.scale;
            const cy = (rect.top + rect.height / 2 - containerRect.top) / this.scale;

            const keyBase = `${nodeId}-${direction}`;
            const idx = Object.keys(cache).filter(k => k.startsWith(keyBase)).length;
            cache[`${keyBase}-${idx}`] = { x: cx, y: cy };
        });

        return cache;
    },

    /** 解析端口位置：优先使用DOM缓存，无缓存时回退到数学计算 */
    _resolvePortPos(node, portId, direction, cache) {
        const keyBase = `${node.id}-${direction}`;
        const matchingKeys = Object.keys(cache).filter(k => k.startsWith(keyBase));

        if (matchingKeys.length > 0) {
            // 尝试按portId精确匹配
            if (portId) {
                for (const k of matchingKeys) {
                    const idx = parseInt(k.split('-').pop());
                    const ports = Array.from(this.overlay.querySelectorAll(`.port.${direction}-port[data-node-id="${node.id}"]`));
                    const el = ports[idx];
                    if (el && el.dataset.portId === portId) return cache[k];
                }
            }
            // 默认取第一个
            return cache[matchingKeys[0]];
        }

        console.warn('[Canvas] 端口DOM位置未找到，使用计算值:', node.id, direction);
        return this._getPortPosition(node, portId, direction);
    },

    _calcEdgePath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const cp = Math.max(80, dx * 0.5);
        return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
    },

    _getEdgeColor(edge) {
        if (edge.color) return edge.color;
        switch (edge.type) {
            case 'output': return '#22c55e';
            case 'consume': return '#ef4444';
            case 'require': return '#f59e0b';
            case 'unlock': return '#3b82f6';
            default: return '#94a3b8';
        }
    },

    _getEdgeValueLabel(edge) {
        if (edge.valueType === 'fixed' && edge.value != null) return String(edge.value);
        if (edge.valueType === 'range') {
            if (edge.minValue != null && edge.maxValue != null) return `${edge.minValue}-${edge.maxValue}`;
            if (edge.minValue != null) return `>=${edge.minValue}`;
            if (edge.maxValue != null) return `<=${edge.maxValue}`;
        }
        if (edge.valueType === 'percentage' && edge.value != null) return `${edge.value}%`;
        if (edge.valueType === 'dynamic') return edge.condition || '';
        return '';
    },

    /** 数学计算回退值（仅当DOM不可用时使用） */
    _getPortPosition(node, portId, direction) {
        const w = this.NODE_WIDTH;
        const portY = node.y + this.HEADER_BAR_H + this.NAME_MIN_H + this.PORT_AREA_H / 2;
        const portOffset = 15; // padding(8) + 端口半宽(7)
        const portX = direction === 'input' ? node.x + portOffset : node.x + w - portOffset;
        return { x: portX, y: portY };
    },

    _shouldShowEdge(edge) {
        if (edge.type === 'output' && !this.filters.showOutputEdges) return false;
        if (edge.type === 'consume' && !this.filters.showConsumeEdges) return false;
        if (edge.type === 'require' && !this.filters.showOutputEdges) return false;
        if (edge.type === 'unlock' && !this.filters.showConsumeEdges) return false;
        return true;
    },

    // ==================== 节点（HTML）渲染 ====================
    _renderNodesOverlay(project) {
        let html = '';
        for (const node of project.nodes) {
            if (!this._shouldShowNode(node)) continue;
            html += this._createNodeElement(node, project);
        }
        this.overlay.innerHTML = html;
        this._bindNodeEvents(project);
    },

    _shouldShowNode(node) {
        if (node.type === 'system' && !this.filters.showSystemNodes) return false;
        if (node.type === 'resource' && !this.filters.showResourceNodes) return false;
        if (node.type === 'resource' && node.visible === false) return false;
        const q = this.filters.searchQuery.trim().toLowerCase();
        if (q && !node.name.toLowerCase().includes(q)) return false;
        return true;
    },

    _createNodeElement(node, project) {
        const w = this.NODE_WIDTH;
        const isSystem = node.type === 'system';
        if (isSystem) return this._createSystemNodeElement(node, project, w);
        else return this._createResourceNodeElement(node, project, w);
    },

    // ==================== 系统节点 HTML ====================
    _createSystemNodeElement(node, project, w) {
        const h = this.calcNodeHeight(node);
        const isSelected = this.selectedNode === node.id;
        const groupColor = this.getGroupColor(node, project);
        const borderColor = this.getBorderColor(node, project);

        const subTypeLabel = node.subType ? `<span class="node-subtype">${node.subType}</span>` : '';
        const levelBadge = node.level ? `<span class="node-level">L${node.level}</span>` : '';

        const inputPorts = node.inputPorts || [];
        const outputPorts = node.outputPorts || [];
        const nameH = h - this.HEADER_BAR_H - this.PORT_AREA_H;

        let portsHtml = `<div style="height:${this.PORT_AREA_H}px;display:flex;justify-content:space-between;align-items:center;padding:0 8px;background:rgba(0,0,0,0.03);">`;

        portsHtml += '<div style="display:flex;gap:4px;align-items:center;">';
        inputPorts.forEach(p => {
            portsHtml += `<div class="port input-port" style="width:10px;height:10px;border-radius:50%;background:var(--consume-color);border:2px solid var(--consume-color);cursor:pointer;"
                          data-port-id="${p.id}" data-direction="input" data-node-id="${node.id}" title="${p.name||'输入'}"></div>`;
        });
        portsHtml += '</div>';

        portsHtml += '<div style="display:flex;gap:4px;align-items:center;">';
        outputPorts.forEach(p => {
            portsHtml += `<div class="port output-port" style="width:10px;height:10px;border-radius:50%;background:var(--output-color);border:2px solid var(--output-color);cursor:pointer;"
                          data-port-id="${p.id}" data-direction="output" data-node-id="${node.id}" title="${p.name||'输出'}"></div>`;
        });
        portsHtml += '</div></div>';

        return `
<div class="canvas-node system-node ${isSelected ? 'selected' : ''}"
     data-node-id="${node.id}"
     style="left:${node.x}px;top:${node.y}px;width:${w}px;height:${h}px;border-color:${borderColor};">
    <div style="background:${groupColor};width:100%;height:${this.HEADER_BAR_H}px;overflow:hidden;"></div>
    <div style="height:${nameH}px;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;">
        <span style="font-weight:500;font-size:13px;">${this._escapeHtml(node.name)}</span>
        ${subTypeLabel}${levelBadge}
    </div>
    ${portsHtml}
</div>`;
    },

    _createResourceNodeElement(node, project, w) {
        const h = this.calcNodeHeight(node);
        const isSelected = this.selectedNode === node.id;
        const typeColor = node.nodeColor || '#f59e0b';
        const resType = project.customResourceTypes?.find(t => t.id === node.resourceType);
        const iconClass = resType?.icon || 'fa-gem';

        const qtyHtml = (node.quantity !== null && node.quantity !== undefined)
            ? `<span class="res-quantity">x${node.quantity}</span>` : '';

        const rarityColors = { common: '#94a3b8', uncommon: '#64748b', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' };
        const rarityColor = rarityColors[node.rarity] || '#94a3b8';

        const inputPorts = node.inputPorts || [];
        const outputPorts = node.outputPorts || [];
        const nameH = h - this.HEADER_BAR_H - this.PORT_AREA_H;

        let portsHtml = `<div style="height:${this.PORT_AREA_H}px;display:flex;justify-content:space-between;align-items:center;padding:0 8px;background:rgba(0,0,0,0.03);">`;

        portsHtml += '<div style="display:flex;gap:4px;align-items:center;">';
        inputPorts.forEach(p => {
            portsHtml += `<div class="port input-port" style="width:10px;height:10px;border-radius:50%;background:var(--consume-color);border:2px solid var(--consume-color);cursor:pointer;"
                          data-port-id="${p.id}" data-direction="input" data-node-id="${node.id}" title="${p.name||'输入'}"></div>`;
        });
        portsHtml += '</div>';

        portsHtml += '<div style="display:flex;gap:4px;align-items:center;">';
        outputPorts.forEach(p => {
            portsHtml += `<div class="port output-port" style="width:10px;height:10px;border-radius:50%;background:var(--output-color);border:2px solid var(--output-color);cursor:pointer;"
                          data-port-id="${p.id}" data-direction="output" data-node-id="${node.id}" title="${p.name||'输出'}"></div>`;
        });
        portsHtml += '</div></div>';

        return `
<div class="canvas-node resource-node ${isSelected ? 'selected' : ''}"
     data-node-id="${node.id}"
     style="left:${node.x}px;top:${node.y}px;width:${w}px;height:${h}px;border-left:3px solid ${typeColor};background:var(--bg-secondary);">
    <div style="background:${typeColor};width:100%;height:${this.HEADER_BAR_H}px;overflow:hidden;"></div>
    <div style="height:${nameH}px;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;">
        <i class="fas ${iconClass}" style="color:${typeColor};font-size:13px;margin-right:6px;"></i>
        <span style="flex:1;font-size:13px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this._escapeHtml(node.name)}</span>
        ${qtyHtml}
        <span class="rarity-dot ${node.rarity||'common'}" style="background:${rarityColor};width:8px;height:8px;border-radius:50%;flex-shrink:0;"
              title="${node.rarity||'普通'}"></span>
    </div>
    ${portsHtml}
</div>`;
    },

    // ==================== 节点事件绑定 ====================
    _bindNodeEvents(project) {
        this.overlay.querySelectorAll('.canvas-node').forEach(card => {
            const nodeId = card.dataset.nodeId;

            card.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('port')) return;
                e.stopPropagation();
                this.selectNode(nodeId);
                PropertyPanel.showNodeProperty(nodeId);
                this.isDragging = true;
                this.dragNode = nodeId;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.dragNodeStartX = node.x;
                    this.dragNodeStartY = node.y;
                }
            });

            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                PropertyPanel.showNodeProperty(nodeId);
            });

            card.addEventListener('contextmenu', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === nodeId);
                ContextMenu.show(e.clientX, e.clientY, { type: 'node', id: nodeId, name: node?.name });
            });
        });

        this.overlay.querySelectorAll('.port').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const dir = port.dataset.direction;
                const nodeId = port.dataset.nodeId;
                const portId = port.dataset.portId;
                if (dir === 'output') {
                    this.enterConnectMode(nodeId, portId);
                }
            });

            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (this.isConnecting && this.connectSource) {
                    const targetNodeId = port.dataset.nodeId;
                    const targetPortId = port.dataset.portId;
                    if (targetNodeId !== this.connectSource) {
                        const result = DataStore.addEdge(this.connectSource, targetNodeId, {
                            sourcePortId: this.connectSourcePort,
                            targetPortId: targetPortId
                        });
                        if (result) {
                            Toast.show('关系已建立', 'success');
                            this.refresh();
                        }
                    }
                    this.exitConnectMode();
                }
            });

            port.addEventListener('mousemove', (e) => {
                if (this.isConnecting) {
                    const rect = this.container.getBoundingClientRect();
                    this._tempMouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
                    this._tempMouseY = (e.clientY - rect.top - this.offsetY) / this.scale;
                    this.refresh();
                }
            });
        });
    },

    clearHighlights() {
        this.overlay.querySelectorAll('.canvas-node').forEach(c => {
            c.classList.remove('selected', 'path-highlight-node', 'path-dimmed-node');
        });
        this.edgesLayer.querySelectorAll('.edge-element').forEach(e => {
            e.classList.remove('selected', 'path-highlight', 'path-dimmed');
        });
    },

    selectNode(nodeId) {
        this.selectedNode = nodeId;
        this.selectedEdge = null;
        const project = DataStore.getCurrentProject();
        if (!project) return;
        this.clearHighlights();
        if (!nodeId) return;

        this.overlay.querySelectorAll('.canvas-node').forEach(c => {
            const id = c.dataset.nodeId;
            c.classList.toggle('selected', id === nodeId);
            const related = this._isNodeRelatedTo(id, nodeId, project);
            c.classList.toggle('path-highlight-node', related && id !== nodeId);
            c.classList.toggle('path-dimmed-node', !related && id !== nodeId);
        });

        this.edgesLayer.querySelectorAll('.edge-element').forEach(e => {
            const edgeId = e.dataset.edgeId;
            const edge = project.edges.find(ed => ed.id === edgeId);
            if (!edge) return;
            const related = (edge.source === nodeId || edge.target === nodeId);
            e.classList.remove('selected');
            e.classList.toggle('path-highlight', related);
            e.classList.toggle('path-dimmed', !related);
        });
    },

    _isNodeRelatedTo(nodeId, selectedId, project) {
        return project.edges.some(e =>
            (e.source === nodeId && e.target === selectedId) ||
            (e.source === selectedId && e.target === nodeId)
        );
    },

    selectEdge(edgeId) {
        this.selectedEdge = edgeId;
        this.selectedNode = null;
        const project = DataStore.getCurrentProject();
        if (!project) return;
        const edge = project.edges.find(e => e.id === edgeId);
        if (!edge) return;

        this.overlay.querySelectorAll('.canvas-node').forEach(c => {
            const id = c.dataset.nodeId;
            c.classList.remove('selected', 'path-highlight-node', 'path-dimmed-node');
        });

        this.edgesLayer.querySelectorAll('.edge-element').forEach(e => {
            const id = e.dataset.edgeId;
            e.classList.remove('selected', 'path-highlight', 'path-dimmed');
            if (id === edgeId) e.classList.add('selected');
        });

        if (edge.source) {
            const srcEl = this.overlay.querySelector(`[data-node-id="${edge.source}"]`);
            if (srcEl) srcEl.classList.add('path-highlight-node');
        }
        if (edge.target) {
            const tgtEl = this.overlay.querySelector(`[data-node-id="${edge.target}"]`);
            if (tgtEl) tgtEl.classList.add('path-highlight-node');
        }
    },

    enterConnectMode(sourceNodeId, sourcePortId) {
        this.isConnecting = true;
        this.connectSource = sourceNodeId || null;
        this.connectSourcePort = sourcePortId || null;
        this.container.style.cursor = 'crosshair';

        this._tempMouseMoveHandler = (e) => {
            if (!this.isConnecting) return;
            const rect = this.container.getBoundingClientRect();
            this._tempMouseX = (e.clientX - rect.left - this.offsetX) / this.scale;
            this._tempMouseY = (e.clientY - rect.top - this.offsetY) / this.scale;
            this.refresh();
        };
        window.addEventListener('mousemove', this._tempMouseMoveHandler);

        this._tempClickHandler = () => { this.exitConnectMode(); };
        setTimeout(() => {
            document.addEventListener('mousedown', this._tempClickHandler, { once: true });
        }, 50);
    },

    exitConnectMode() {
        this.isConnecting = false;
        this.connectSource = null;
        this.connectSourcePort = null;
        this._tempMouseX = null;
        this._tempMouseY = null;
        this.container.style.cursor = '';

        if (this._tempMouseMoveHandler) {
            window.removeEventListener('mousemove', this._tempMouseMoveHandler);
            this._tempMouseMoveHandler = null;
        }
        if (this._tempClickHandler) {
            document.removeEventListener('mousedown', this._tempClickHandler);
            this._tempClickHandler = null;
        }
        this.refresh();
    },

    _onEdgeContextMenu(e, edgeId) {
        e.stopPropagation();
        e.preventDefault();
        const project = DataStore.getCurrentProject();
        const edge = project?.edges.find(ed => ed.id === edgeId);
        ContextMenu.show(e.clientX, e.clientY, { type: 'edge', id: edgeId, name: `${edge?.source||''}->${edge?.target||''}` });
    },

    autoLayout() {
        const project = DataStore.getCurrentProject();
        if (!project) return;
        const nodes = project.nodes.filter(n => n.type === 'system');
        if (nodes.length === 0) return;

        const rootNodes = [];
        nodes.forEach(n => {
            if (!n.parentId) rootNodes.push(n);
        });

        const H_GAP = 200;
        const V_GAP = 90;
        const ROOT_Y_START = 60;
        const X_OFFSET = 100;
        let currentX = X_OFFSET;

        rootNodes.sort((a, b) => a.level - b.level);

        rootNodes.forEach(root => {
            root.x = currentX;
            root.y = ROOT_Y_START;
            const queue = [{ node: root, x: currentX, y: ROOT_Y_START }];
            const visited = new Set([root.id]);

            while (queue.length > 0) {
                const { node: parent, x: px, y: py } = queue.shift();
                const children = nodes.filter(n => n.parentId === parent.id);

                children.forEach((child, i) => {
                    if (visited.has(child.id)) return;
                    visited.add(child.id);
                    child.x = px + (i - (children.length - 1) / 2) * H_GAP * 0.6 + (children.length > 1 ? 0 : H_GAP * 0.3);
                    child.y = py + V_GAP;
                    queue.push({ node: child, x: child.x, y: child.y });
                });
            }

            const subtreeNodes = [root, ...nodes.filter(n => {
                let p = n.parentId;
                while (p) {
                    if (p === root.id) return true;
                    p = nodes.find(nn => nn.id === p)?.parentId;
                }
                return false;
            })];
            const maxX = Math.max(...subtreeNodes.map(n => n.x));
            currentX = maxX + H_GAP + 50;
        });

        const resourceNodes = project.nodes.filter(n => n.type === 'resource');
        const resY = Math.max(...nodes.map(n => n.y), ROOT_Y_START) + V_GAP * 2;
        resourceNodes.forEach((r, i) => {
            r.x = X_OFFSET + i * (this.NODE_WIDTH + 30);
            r.y = resY;
        });

        DataStore.batchUpdatePositions([...nodes, ...resourceNodes].map(n => ({ id: n.id, x: n.x, y: n.y })));
        this.resetView();
        Toast.show('布局已自动整理', 'info');
    },

    updateMiniMap() {
        const canvas = this.miniMapCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const project = DataStore.getCurrentProject();
        if (!project || project.nodes.length === 0) return;

        const xs = project.nodes.map(n => n.x);
        const ys = project.nodes.map(n => n.y);
        const minX = Math.min(...xs) - 50;
        const minY = Math.min(...ys) - 30;
        const maxX = Math.max(...xs) + this.NODE_WIDTH + 50;
        const maxY = Math.max(...ys) + 60;
        const rangeX = Math.max(maxX - minX, 1);
        const rangeY = Math.max(maxY - minY, 1);

        const scaleX = (W - 20) / rangeX;
        const scaleY = (H - 20) / rangeY;
        const s = Math.min(scaleX, scaleY);

        const toMapX = x => 10 + (x - minX) * s;
        const toMapY = y => 10 + (y - minY) * s;

        project.edges.forEach(edge => {
            const sn = project.nodes.find(n => n.id === edge.source);
            const tn = project.nodes.find(n => n.id === edge.target);
            if (!sn || !tn) return;
            ctx.beginPath();
            ctx.strokeStyle = this._getEdgeColor(edge) + '88';
            ctx.lineWidth = 1;
            ctx.moveTo(toMapX(sn.x + this.NODE_WIDTH / 2), toMapY(sn.y + 25));
            ctx.lineTo(toMapX(tn.x + this.NODE_WIDTH / 2), toMapY(tn.y + 25));
            ctx.stroke();
        });

        project.nodes.forEach(node => {
            if (node.type === 'system') {
                ctx.fillStyle = node.parentColor || '#3b82f6';
            } else {
                ctx.fillStyle = node.nodeColor || '#f59e0b';
            }
            const nw = Math.max(this.NODE_WIDTH * s, 3);
            const nh = this.calcNodeHeight(node) * s;
            ctx.fillRect(toMapX(node.x), toMapY(node.y), nw, Math.max(nh, 2));
        });

        const vp = document.getElementById('mini-map-viewport');
        if (vp && this.container) {
            const rect = this.container.getBoundingClientRect();
            const vpw = (rect.width / this.scale) * s;
            const vph = (rect.height / this.scale) * s;
            const vpx = 10 + (-this.offsetX / this.scale - minX) * s;
            const vpy = 10 + (-this.offsetY / this.scale - minY) * s;
            vp.style.left = Math.max(0, Math.min(vpx, W - 10)) + 'px';
            vp.style.top = Math.max(0, Math.min(vpy, H - 10)) + 'px';
            vp.style.width = Math.min(vpw, W) + 'px';
            vp.style.height = Math.min(vph, H) + 'px';
        }
    },

    _updateStatusBar(project) {
        const visibleNodes = project.nodes.filter(n => this._shouldShowNode(n)).length;
        const visibleEdges = project.edges.filter(e => this._shouldShowEdge(e)).length;
        const ncEl = document.getElementById('node-count');
        const ecEl = document.getElementById('edge-count');
        if (ncEl) ncEl.textContent = `节点数: ${visibleNodes}`;
        if (ecEl) ecEl.textContent = `关系数: ${visibleEdges}`;
    }
};
