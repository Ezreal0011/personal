/**
 * 游戏资源流向蓝图工具 - 画布模块
 */
const Canvas = {
    container: null,
    svg: null,
    edgesLayer: null,
    nodesLayer: null,
    overlay: null,
    miniMapCanvas: null,

    scale: 1,
    offsetX: 50,
    offsetY: 30,
    minScale: 0.1,
    maxScale: 3,

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

    selectedNode: null,
    selectedEdge: null,

    filters: {
        showSystemNodes: true,
        showResourceNodes: true,
        showOutputEdges: true,
        showConsumeEdges: true,
        searchQuery: ''
    },

    NODE_WIDTH: 140,
    NODE_HEIGHT: 32,

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
            DataStore.updateNodePosition(this.dragNode, this.dragNodeStartX + dx, this.dragNodeStartY + dy);
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
            const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === this.dragNode);
            if (node) DataStore.batchUpdatePositions([{ id: node.id, x: node.x, y: node.y }]);
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

    _renderAll(project) {
        this._renderNodesOverlay(project);
        this._renderEdgesWithRealPositions(project);
        this._updateStatusBar(project);
        this.updateMiniMap();
    },

    _renderNodesOverlay(project) {
        let html = '';
        for (const node of project.nodes) {
            if (!this._shouldShowNode(node)) continue;
            html += this._createNodeElement(node, project);
        }
        this.overlay.innerHTML = html;
        this._bindNodeEvents();
    },

    _shouldShowNode(node) {
        // 根父节点（无parentId的系统节点）不在画布上显示
        if (node.type === 'system' && !node.parentId) return false;
        if (node.type === 'system' && !this.filters.showSystemNodes) return false;
        if (node.type === 'resource' && !this.filters.showResourceNodes) return false;
        // 资源节点默认显示
        const q = this.filters.searchQuery.trim().toLowerCase();
        if (q && !node.name.toLowerCase().includes(q)) return false;
        return true;
    },

    _createNodeElement(node, project) {
        const isSystem = node.type === 'system';
        const isSelected = this.selectedNode === node.id;

        if (isSystem) return this._createSystemNode(node, project, isSelected);
        else return this._createResourceNode(node, project, isSelected);
    },

    _createSystemNode(node, project, isSelected) {
        const groupColor = node.parentColor || '#3b82f6';
        const borderColor = node.roleColor || 'var(--border-color)';
        const inputPorts = node.inputPorts || [];
        const outputPorts = node.outputPorts || [];
        
        // 获取最新的项目数据
        const currentProject = DataStore.getCurrentProject();
        const edges = currentProject ? currentProject.edges : [];
        
        // 节点自适应高度：基础高度 + 端口区
        const baseH = 28;
        const portAreaH = Math.max(inputPorts.length, outputPorts.length) * 18;
        const h = baseH + portAreaH;

        // 渲染端口
        let portsHtml = '';
        if (inputPorts.length > 0 || outputPorts.length > 0) {
            portsHtml = `<div style="height:${portAreaH}px;display:flex;justify-content:space-between;align-items:flex-start;padding:4px 8px;background:rgba(0,0,0,0.03);">`;
            
            // 左侧输入端口（红色）+ 名称（继承自连接的输出端口）
            if (inputPorts.length > 0) {
                portsHtml += '<div style="display:flex;flex-direction:column;gap:4px;">';
                inputPorts.forEach(p => {
                    // 查找连接到该输入端口的边
                    let portName = p.name || '';
                    const connectedEdges = (project.edges || []).filter(e => e.target === node.id && e.targetPortId === p.id);
                    if (connectedEdges.length > 0) {
                        const edge = connectedEdges[0];
                        if (edge.sourcePortId) {
                            const sourceNode = project.nodes.find(n => n.id === edge.source);
                            if (sourceNode && sourceNode.outputPorts) {
                                const srcPort = sourceNode.outputPorts.find(op => op.id === edge.sourcePortId);
                                if (srcPort && srcPort.name) portName = srcPort.name;
                            }
                        }
                    }
                    portsHtml += `<div style="display:flex;align-items:center;gap:4px;">
                        <div class="port input-port" data-port-id="${p.id}" data-direction="input" data-node-id="${node.id}" 
                            style="width:10px;height:10px;border-radius:50%;background:var(--consume-color);border:2px solid var(--consume-color);cursor:pointer;"
                            title="${portName||'输入'}"></div>
                        <span style="font-size:11px;color:var(--text-secondary);">${portName||''}</span>
                    </div>`;
                });
                portsHtml += '</div>';
            } else {
                portsHtml += '<div></div>';
            }
            
            // 右侧输出端口（绿色）+ 名称
            if (outputPorts.length > 0) {
                portsHtml += '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">';
                outputPorts.forEach(p => {
                    portsHtml += `<div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-size:11px;color:var(--text-secondary);">${p.name||''}</span>
                        <div class="port output-port" data-port-id="${p.id}" data-direction="output" data-node-id="${node.id}"
                            style="width:10px;height:10px;border-radius:50%;background:var(--output-color);border:2px solid var(--output-color);cursor:pointer;"
                            title="${p.name||'输出'}"></div>
                    </div>`;
                });
                portsHtml += '</div>';
            }
            portsHtml += '</div>';
        }

        return `<div class="canvas-node system-node ${isSelected ? 'selected' : ''}" data-node-id="${node.id}" style="left:${node.x}px;top:${node.y}px;width:${this.NODE_WIDTH}px;height:${h}px;border-color:${borderColor};">
    <div style="background:${groupColor};width:100%;height:4px;overflow:hidden;"></div>
    <div style="height:${baseH-4}px;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;">
        <span style="font-weight:500;font-size:13px;">${this._escapeHtml(node.name)}</span>
    </div>
    ${portsHtml}
</div>`;
    },

    _createResourceNode(node, project, isSelected) {
        const typeColor = node.nodeColor || '#f59e0b';
        const resType = project.customResourceTypes?.find(t => t.id === node.resourceType);
        const iconClass = resType?.icon || 'fa-gem';
        
        // 获取所有连接到该资源节点输入端口的边
        const inputEdges = project.edges.filter(e => e.target === node.id && (e.type === 'output' || e.type === 'consume'));
        
        // 计算总数值（使用与属性面板相同的逻辑：优先读取输出端口的portValue）
        let totalSummary = 0;
        let hasValidValue = false;
        
        inputEdges.forEach(edge => {
            const srcNode = project.nodes.find(n => n.id === edge.source);
            if (!srcNode) return;
            
            const srcPort = (srcNode.outputPorts || []).find(p => p.id === edge.sourcePortId);
            const portType = srcPort?.portType || 'value';
            
            let val = null;
            if (srcPort?.portValue != null) {
                val = parseFloat(srcPort.portValue);
                if (isNaN(val)) val = null;
            } else if (edge.valueType === 'fixed') {
                val = parseFloat(edge.value);
                if (isNaN(val)) val = null;
            }
            
            if (val !== null) {
                hasValidValue = true;
                totalSummary += val;
            }
        });
        
        // 构建汇总显示（在中间显示一个总数值）
        let inputSummaryHtml = '';
        if (hasValidValue) {
            const edgeColor = 'var(--output-color)';
            inputSummaryHtml = `<div style="display:flex;align-items:center;justify-content:center;padding:8px 0;">
                <span style="font-size:24px;font-weight:bold;color:${edgeColor};">x${totalSummary}</span>
            </div>`;
        }
        
        const rarityColors = { common: '#94a3b8', uncommon: '#64748b', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' };
        const rarityColor = rarityColors[node.rarity] || '#94a3b8';

        // 获取输入输出端口
        const inputPorts = node.inputPorts || [];
        const outputPorts = node.outputPorts || [];

        // 计算高度：头部 + 汇总区域 + 端口区域
        const headerH = 32;
        const summaryH = hasValidValue ? 48 : 0;
        const maxPorts = Math.max(inputPorts.length, outputPorts.length);
        const portAreaH = maxPorts > 0 ? maxPorts * 20 + 8 : 0;
        const h = headerH + summaryH + portAreaH;

        // 端口区域：左侧输入（竖排），右侧输出（竖排）
        let portsHtml = '';
        if (inputPorts.length > 0 || outputPorts.length > 0) {
            portsHtml = `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:4px 8px;background:rgba(0,0,0,0.03);">`;
            
            // 左侧输入端口
            if (inputPorts.length > 0) {
                portsHtml += '<div style="display:flex;flex-direction:column;gap:6px;">';
                inputPorts.forEach(p => {
                    portsHtml += `<div style="display:flex;align-items:center;gap:4px;">
                        <div class="port input-port" data-port-id="${p.id}" data-direction="input" data-node-id="${node.id}" 
                            style="width:10px;height:10px;border-radius:50%;background:var(--consume-color);border:2px solid var(--consume-color);cursor:pointer;flex-shrink:0;"
                            title="${p.name||'输入'}"></div>
                        <span style="font-size:10px;color:var(--text-secondary);">${p.name||''}</span>
                    </div>`;
                });
                portsHtml += '</div>';
            } else {
                portsHtml += '<div></div>';
            }
            
            // 右侧输出端口
            if (outputPorts.length > 0) {
                portsHtml += '<div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">';
                outputPorts.forEach(p => {
                    portsHtml += `<div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-size:10px;color:var(--text-secondary);">${p.name||''}</span>
                        <div class="port output-port" data-port-id="${p.id}" data-direction="output" data-node-id="${node.id}"
                            style="width:10px;height:10px;border-radius:50%;background:var(--output-color);border:2px solid var(--output-color);cursor:pointer;flex-shrink:0;"
                            title="${p.name||'输出'}"></div>
                    </div>`;
                });
                portsHtml += '</div>';
            } else {
                portsHtml += '<div></div>';
            }
            
            portsHtml += '</div>';
        }

        return `<div class="canvas-node resource-node ${isSelected ? 'selected' : ''}" data-node-id="${node.id}" style="left:${node.x}px;top:${node.y}px;width:${this.NODE_WIDTH}px;height:${h}px;border-left:3px solid ${typeColor};background:var(--bg-secondary);">
    <div style="background:${typeColor};width:100%;height:4px;overflow:hidden;"></div>
    <div style="height:${headerH - 4}px;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;flex-shrink:0;">
        <i class="fas ${iconClass}" style="color:${typeColor};font-size:13px;margin-right:6px;"></i>
        <span style="flex:1;font-size:13px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${this._escapeHtml(node.name)}</span>
        <span class="rarity-dot ${node.rarity||'common'}" style="background:${rarityColor};width:8px;height:8px;border-radius:50%;flex-shrink:0;" title="${node.rarity||'普通'}"></span>
    </div>
    ${inputSummaryHtml}
    ${portsHtml}
</div>`;
    },

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    _bindNodeEvents() {
        // 节点事件
        this.overlay.querySelectorAll('.canvas-node').forEach(card => {
            const nodeId = card.dataset.nodeId;
            card.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.selectNode(nodeId);
                PropertyPanel.showNodeProperty(nodeId);
                this.isDragging = true;
                this.dragNode = nodeId;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === nodeId);
                if (node) { this.dragNodeStartX = node.x; this.dragNodeStartY = node.y; }
            });
            card.addEventListener('dblclick', (e) => { e.stopPropagation(); PropertyPanel.showNodeProperty(nodeId); });
            card.addEventListener('contextmenu', (e) => {
                e.stopPropagation(); e.preventDefault();
                const node = DataStore.getCurrentProject()?.nodes.find(n => n.id === nodeId);
                ContextMenu.show(e.clientX, e.clientY, { type: 'node', id: nodeId, name: node?.name });
            });
        });

        // 端口事件 - 连线
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
                        // 检查是否已存在相同端口的连线，有则删除旧连线
                        const project = DataStore.getCurrentProject();
                        const existingEdge = project?.edges.find(e => 
                            e.source === this.connectSource && e.target === targetNodeId &&
                            e.sourcePortId === this.connectSourcePort && e.targetPortId === targetPortId
                        );
                        if (existingEdge) {
                            DataStore.deleteEdge(existingEdge.id);
                            Toast.show('已删除旧关系', 'info');
                            this.refresh();
                            this.exitConnectMode();
                            return;
                        }
                        
                        // 获取输出端口的名字
                        const sourceNode = DataStore.getCurrentProject()?.nodes.find(n => n.id === this.connectSource);
                        const sourcePort = sourceNode?.outputPorts?.find(p => p.id === this.connectSourcePort);
                        const sourcePortName = sourcePort?.name || '';
                        
                        const result = DataStore.addEdge(this.connectSource, targetNodeId, {
                            sourcePortId: this.connectSourcePort,
                            targetPortId: targetPortId
                        });
                        if (result) {
                            // 把输出端口的名字复制给输入端口
                            const targetNode = DataStore.getCurrentProject()?.nodes.find(n => n.id === targetNodeId);
                            if (targetNode && targetPortId) {
                                const inputPort = (targetNode.inputPorts || []).find(p => p.id === targetPortId);
                                if (inputPort && sourcePortName) {
                                    inputPort.name = sourcePortName;
                                }
                            }
                            DataStore.save();
                            Toast.show('已建立关系（输入端口名称: ' + sourcePortName + '）', 'success');
                            this.refresh();
                        }
                    }
                    this.exitConnectMode();
                }
            });
        });
    },

    _renderEdgesWithRealPositions(project) {
        const portCache = this._buildPortPositionCache();
        let html = '';

        for (const edge of project.edges) {
            if (!this._shouldShowEdge(edge)) continue;
            const sourceNode = project.nodes.find(n => n.id === edge.source);
            const targetNode = project.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) continue;
            if (!this._shouldShowNode(sourceNode) || !this._shouldShowNode(targetNode)) continue;

            const sp = this._resolvePortPos(sourceNode, edge.sourcePortId, 'output', portCache);
            const tp = this._resolvePortPos(targetNode, edge.targetPortId, 'input', portCache);
            if (!sp || !tp) continue;

            const color = this._getEdgeColor(edge);
            const isSelected = this.selectedEdge === edge.id;
            const path = this._calcEdgePath(sp.x, sp.y, tp.x, tp.y);

            html += `<path class="edge-element ${isSelected ? 'selected' : ''}" d="${path}" stroke="${color}" stroke-width="${isSelected ? 3 : 2}" fill="none" marker-end="url(#arrow-${edge.type || 'default'})" data-edge-id="${edge.id}" style="cursor:pointer;" onclick="Canvas.selectEdge('${edge.id}')" oncontextmenu="Canvas._onEdgeContextMenu(event, '${edge.id}')"/>`;

            const valueLabel = this._getEdgeValueLabel(edge);
            if (valueLabel) {
                const mx = (sp.x + tp.x) / 2;
                const my = (sp.y + tp.y) / 2;
                html += `<text x="${mx}" y="${my - 8}" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold" style="pointer-events:none;">${valueLabel}</text>`;
            }
        }

        if (this.isConnecting && this.connectSource) {
            const srcNode = project.nodes.find(n => n.id === this.connectSource);
            if (srcNode) {
                const sp = this._resolvePortPos(srcNode, this.connectSourcePort, 'output', portCache);
                if (sp) {
                    const path = this._calcEdgePath(sp.x, sp.y, this._tempMouseX || 0, this._tempMouseY || 0);
                    html += `<path class="edge-element" d="${path}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6,4" fill="none" marker-end="url(#arrow-default)" style="pointer-events:none;"/>`;
                }
            }
        }

        this.edgesLayer.innerHTML = html;
    },

    _buildPortPositionCache() {
        const cache = {};
        const containerRect = this.container.getBoundingClientRect();
        
        // 从端口DOM直接读取位置
        this.overlay.querySelectorAll('.port').forEach(portEl => {
            const nodeId = portEl.dataset.nodeId;
            const direction = portEl.dataset.direction;
            const portId = portEl.dataset.portId;
            const rect = portEl.getBoundingClientRect();
            
            // 转换为画布坐标
            const x = (rect.left + rect.width/2 - containerRect.left - this.offsetX) / this.scale;
            const y = (rect.top + rect.height/2 - containerRect.top - this.offsetY) / this.scale;
            
            cache[`${nodeId}-${direction}-${portId}`] = { x, y };
        });
        
        return cache;
    },

    _resolvePortPos(node, portId, direction, cache) {
        // 优先按portId精确匹配
        if (portId && cache[`${node.id}-${direction}-${portId}`]) {
            return cache[`${node.id}-${direction}-${portId}`];
        }
        // 回退：找第一个
        const keys = Object.keys(cache).filter(k => k.startsWith(`${node.id}-${direction}-`));
        if (keys.length > 0) {
            return cache[keys[0]];
        }
        return this._getPortPosition(node, direction);
    },

    _getPortPosition(node, direction) {
        const w = this.NODE_WIDTH;
        const portY = node.y + this.NODE_HEIGHT - 6;
        const portX = direction === 'input' ? node.x + 15 : node.x + w - 15;
        return { x: portX, y: portY };
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

    _shouldShowEdge(edge) {
        if (edge.type === 'output' && !this.filters.showOutputEdges) return false;
        if (edge.type === 'consume' && !this.filters.showConsumeEdges) return false;
        return true;
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
            const related = project.edges.some(e => (e.source === id && e.target === nodeId) || (e.source === nodeId && e.target === id));
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

    selectEdge(edgeId) {
        this.selectedEdge = edgeId;
        this.selectedNode = null;
        const project = DataStore.getCurrentProject();
        if (!project) return;
        const edge = project.edges.find(e => e.id === edgeId);
        if (!edge) return;

        // 打开属性面板
        PropertyPanel.showEdgeProperty(edgeId);

        this.overlay.querySelectorAll('.canvas-node').forEach(c => {
            c.classList.remove('selected', 'path-highlight-node', 'path-dimmed-node');
        });

        this.edgesLayer.querySelectorAll('.edge-element').forEach(e => {
            e.classList.remove('selected', 'path-highlight', 'path-dimmed');
            if (e.dataset.edgeId === edgeId) e.classList.add('selected');
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
        this.connectSource = sourceNodeId;
        this.connectSourcePort = sourcePortId;
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
        setTimeout(() => document.addEventListener('mousedown', this._tempClickHandler, { once: true }), 50);
    },

    exitConnectMode() {
        this.isConnecting = false;
        this.connectSource = null;
        this.connectSourcePort = null;
        this._tempMouseX = null;
        this._tempMouseY = null;
        this.container.style.cursor = '';
        if (this._tempMouseMoveHandler) { window.removeEventListener('mousemove', this._tempMouseMoveHandler); this._tempMouseMoveHandler = null; }
        if (this._tempClickHandler) { document.removeEventListener('mousedown', this._tempClickHandler); this._tempClickHandler = null; }
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

        const rootNodes = nodes.filter(n => !n.parentId);
        const H_GAP = 200, V_GAP = 90, ROOT_Y = 60, X_OFFSET = 100;
        let currentX = X_OFFSET;

        rootNodes.sort((a, b) => (a.level || 1) - (b.level || 1));

        rootNodes.forEach(root => {
            root.x = currentX;
            root.y = ROOT_Y;
            const queue = [root];
            const visited = new Set([root.id]);

            while (queue.length > 0) {
                const parent = queue.shift();
                const children = nodes.filter(n => n.parentId === parent.id);
                children.forEach((child, i) => {
                    if (visited.has(child.id)) return;
                    visited.add(child.id);
                    child.x = parent.x + (i - (children.length - 1) / 2) * 120;
                    child.y = parent.y + V_GAP;
                    queue.push(child);
                });
            }
            currentX += H_GAP;
        });

        const resourceNodes = project.nodes.filter(n => n.type === 'resource');
        const resY = Math.max(...nodes.map(n => n.y), ROOT_Y) + V_GAP * 2;
        resourceNodes.forEach((r, i) => {
            r.x = X_OFFSET + i * 170;
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
        const W = canvas.width, H = canvas.height;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);

        const project = DataStore.getCurrentProject();
        if (!project || project.nodes.length === 0) return;

        const xs = project.nodes.map(n => n.x);
        const ys = project.nodes.map(n => n.y);
        const minX = Math.min(...xs) - 50;
        const minY = Math.min(...ys) - 30;
        const maxX = Math.max(...xs) + this.NODE_WIDTH + 50;
        const maxY = Math.max(...ys) + this.NODE_HEIGHT + 30;

        const scaleX = (W - 20) / Math.max(maxX - minX, 1);
        const scaleY = (H - 20) / Math.max(maxY - minY, 1);
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
            ctx.moveTo(toMapX(sn.x + this.NODE_WIDTH / 2), toMapY(sn.y + this.NODE_HEIGHT / 2));
            ctx.lineTo(toMapX(tn.x + this.NODE_WIDTH / 2), toMapY(tn.y + this.NODE_HEIGHT / 2));
            ctx.stroke();
        });

        project.nodes.forEach(node => {
            ctx.fillStyle = node.type === 'system' ? (node.parentColor || '#3b82f6') : (node.nodeColor || '#f59e0b');
            ctx.fillRect(toMapX(node.x), toMapY(node.y), this.NODE_WIDTH * s, this.NODE_HEIGHT * s);
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
        const nc = document.getElementById('node-count');
        const ec = document.getElementById('edge-count');
        if (nc) nc.textContent = `节点数: ${project.nodes.filter(n => this._shouldShowNode(n)).length}`;
        if (ec) ec.textContent = `关系数: ${project.edges.filter(e => this._shouldShowEdge(e)).length}`;
    }
};