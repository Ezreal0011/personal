/**
 * 数据管理模块
 * 负责项目数据的存储、读取、序列化和反序列化
 */
const DataStore = {
    // 所有项目列表
    projects: [],
    // 当前打开的项目ID
    currentProjectId: null,
    
    // 历史记录栈（撤销/重做）
    undoStack: [],
    redoStack: [],
    maxHistory: 50,

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    generatePortId() {
        return 'p_' + Math.random().toString(36).substr(2, 6);
    },

    /**
     * 初始化：从localStorage加载数据
     */
    init() {
        const saved = localStorage.getItem('game_blueprint_projects');
        if (saved) {
            try {
                this.projects = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load projects:', e);
                this.projects = [];
            }
        }
        
        // 迁移旧数据：为没有端口定义的节点添加默认端口
        this.migrateProjects();
        
        // 如果没有项目，创建示例项目
        if (this.projects.length === 0) {
            this.createExampleProject();
        }
    },

    /**
     * 迁移旧项目数据：确保节点有端口、项目有子类型列表/资源类型列表、根级父节点有颜色
     */
    migrateProjects() {
        let needsSave = false;
        // 预设颜色池
        const colorPalette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
        let colorIndex = 0;
        
        // 默认资源类型列表
        const defaultResourceTypes = [
            { id: 'currency', name: '货币', icon: 'fa-coins', color: '#f59e0b' },
            { id: 'material', name: '养成材料', icon: 'fa-gem', color: '#8b5cf6' },
            { id: 'stamina', name: '体力类', icon: 'fa-bolt', color: '#06b6d4' }
        ];
        
        this.projects.forEach(project => {
            // 确保有 customSubTypes
            if (!project.customSubTypes || !Array.isArray(project.customSubTypes)) {
                project.customSubTypes = [
                    { id: 'normal', name: '普通' },
                    { id: 'key', name: '关键' },
                    { id: 'daily', name: '日常' },
                    { id: 'weekly', name: '周常' }
                ];
                needsSave = true;
            }

            // 确保有 customResourceTypes
            if (!project.customResourceTypes || !Array.isArray(project.customResourceTypes)) {
                project.customResourceTypes = [...defaultResourceTypes];
                needsSave = true;
            }
            
            // 确保每个节点有端口数据，根级父节点有颜色，资源节点有visible/quantity
            project.nodes.forEach(node => {
                let migrated = false;
                if (!node.inputPorts || !Array.isArray(node.inputPorts)) {
                    node.inputPorts = [{ id: this.generatePortId(), name: '输入' }];
                    migrated = true;
                }
                if (!node.outputPorts || !Array.isArray(node.outputPorts)) {
                    node.outputPorts = [{ id: this.generatePortId(), name: '输出' }];
                    migrated = true;
                }
                // 确保端口有id字段，输出端口有portType
                node.inputPorts.forEach(p => { if (!p.id) p.id = this.generatePortId(); });
                node.outputPorts.forEach(p => {
                    if (!p.id) p.id = this.generatePortId();
                    if (p.portType === undefined) { p.portType = 'value'; migrated = true; }
                    // portValue 可以为 null（未配置），无需强制迁移
                });
                
                // 根级父节点（无parentId）补默认颜色和角色类型
                if (!node.parentId && !node.parentColor && node.type === 'system') {
                    node.parentColor = colorPalette[colorIndex % colorPalette.length];
                    colorIndex++;
                    migrated = true;
                }
                // 根级父节点补默认 role（产出系统）
                if (!node.parentId && !node.role && node.type === 'system') {
                    node.role = 'output';
                    migrated = true;
                }

                // 资源节点：补 visible 和 quantity 字段
                if (node.type === 'resource') {
                    if (node.visible === undefined) {
                        node.visible = false;  // 默认不显示卡片
                        migrated = true;
                    }
                    if (node.quantity === undefined) {
                        node.quantity = null;   // null 表示未配置
                        migrated = true;
                    }
                }
                
                if (migrated) needsSave = true;
            });
            
            // 确保边有端口信息（向后兼容）
            project.edges.forEach(edge => {
                if (!edge.sourcePortId) edge.sourcePortId = null;
                if (!edge.targetPortId) edge.targetPortId = null;
            });
        });
        
        if (needsSave) {
            try {
                const data = JSON.stringify(this.projects);
                localStorage.setItem('game_blueprint_projects', data);
                console.log('[DataStore] 数据迁移完成');
            } catch(e) {
                console.error('[DataStore] 迁移保存失败:', e);
            }
        }
    },

    /**
     * 创建示例项目（演示用）
     */
    createExampleProject() {
        const exampleProject = {
            id: this.generateId(),
            name: '卡牌养成资源关系图',
            version: '0.2',
            description: '卡牌游戏资源流向示例',
            updatedAt: new Date().toISOString(),
            customSubTypes: [
                { id: 'normal', name: '普通' },
                { id: 'key', name: '关键' },
                { id: 'daily', name: '日常' },
                { id: 'weekly', name: '周常' }
            ],
            nodes: [
                // 系统节点 — 根级父节点（无parentId）带 parentColor 颜色标识和 role 类型
                // 主线地图系（蓝色，产出系统）
                { id: 'n1', name: '主线地图', type: 'system', subType: null, level: 1, parentId: null, parentColor: '#3b82f6', role: 'output', x: 400, y: 80, tags: ['PVE'], description: '主要推图系统', inputPorts: [{id:'in0',name:'输入'}], outputPorts: [{id:'out0',name:'产出'}] },
                { id: 'n2', name: '普通章节', type: 'system', subType: 'normal', level: 2, parentId: 'n1', x: 250, y: 180, tags: [], description: '', inputPorts: [{id:'in0',name:'输入'}], outputPorts: [{id:'out0',name:'产出'}] },
                { id: 'n3', name: '关键章节', type: 'system', subType: 'key', level: 2, parentId: 'n1', x: 550, y: 180, tags: ['重要'], description: '重要关卡', inputPorts: [{id:'in0',name:'输入'}], outputPorts: [{id:'out0',name:'产出'},{id:'out1',name:'首通奖励'}] },
                { id: 'n7', name: '活动副本', type: 'system', subType: 'daily', level: 2, parentId: 'n1', x: 700, y: 280, tags: ['日常'], description: '每日活动副本', inputPorts: [{id:'in0',name:'体力输入'}], outputPorts: [{id:'out0',name:'奖励产出'},{id:'out1',name:'额外掉落'}] },
                // 人物养成系（紫色，消耗系统）
                { id: 'n4', name: '人物养成', type: 'system', subType: null, level: 1, parentId: null, parentColor: '#8b5cf6', role: 'consume', x: 400, y: 380, tags: ['核心'], description: '角色成长系统', inputPorts: [{id:'in0',name:'经验输入'},{id:'in1',name:'材料输入'}], outputPorts: [{id:'out0',name:'角色成长'}] },
                { id: 'n5', name: '升级', type: 'system', subType: null, level: 2, parentId: 'n4', x: 300, y: 480, tags: [], description: '角色等级提升', inputPorts: [{id:'in0',name:'输入'}], outputPorts: [{id:'out0',name:'输出'}] },
                { id: 'n6', name: '进阶', type: 'system', subType: null, level: 2, parentId: 'n4', x: 520, y: 480, tags: [], description: '角色品质提升', inputPorts: [{id:'in0',name:'输入'}], outputPorts: [{id:'out0',name:'输出'}] },
                
                // 资源节点
                { id: 'r1', name: '经验书', type: 'resource', resourceType: 'material', rarity: 'uncommon', x: 200, y: 320, tags: [], description: '用于角色升级的经验道具', inputPorts: [], outputPorts: [{id:'out0',name:'输出'}] },
                { id: 'r2', name: '突破道具', type: 'resource', resourceType: 'material', rarity: 'rare', x: 650, y: 380, tags: [], description: '角色进阶必需材料', inputPorts: [], outputPorts: [{id:'out0',name:'输出'}] },
                { id: 'r3', name: '金币', type: 'resource', resourceType: 'currency', rarity: 'common', x: 100, y: 480, tags: [], description: '通用货币', inputPorts: [], outputPorts: [{id:'out0',name:'输出'}] },
                { id: 'r4', name: '体力', type: 'resource', resourceType: 'stamina', rarity: 'common', x: 750, y: 180, tags: [], description: '行动点数', inputPorts: [], outputPorts: [{id:'out0',name:'输出'}] },
            ],
            edges: [
                // 产出关系（output）
                { id: 'e1', source: 'n2', target: 'r1', type: 'output', valueType: 'range', minValue: 10, maxValue: 50, condition: '通关奖励' },
                { id: 'e2', source: 'n3', target: 'r1', type: 'output', valueType: 'range', minValue: 30, maxValue: 80, condition: '首通奖励翻倍' },
                { id: 'e3', source: 'n3', target: 'r2', type: 'output', valueType: 'fixed', value: 5, condition: '关键章节专属掉落' },
                { id: 'e4', source: 'n7', target: 'r1', type: 'output', valueType: 'range', minValue: 20, maxValue: 60, condition: '活动加成' },
                { id: 'e5', source: 'n2', target: 'r3', type: 'output', valueType: 'fixed', value: 500, condition: '基础金币奖励' },
                // 消耗关系（consume）
                { id: 'e6', source: 'n5', target: 'r1', type: 'consume', valueType: 'fixed', value: 100, condition: '每次升级消耗' },
                { id: 'e7', source: 'n6', target: 'r2', type: 'consume', valueType: 'fixed', value: 20, condition: '每次进阶消耗' },
                { id: 'e8', source: 'n5', target: 'r3', type: 'consume', valueType: 'fixed', value: 1000, condition: '升级费用' },
                { id: 'e9', source: 'n2', target: 'r4', type: 'consume', valueType: 'fixed', value: 8, condition: '每次战斗消耗体力' },
                { id: 'e10', source: 'n7', target: 'r4', type: 'consume', valueType: 'fixed', value: 12, condition: '活动副本消耗' },
            ]
        };
        
        this.projects.push(exampleProject);
        this.save();
    },

    /**
     * 保存所有项目到localStorage
     */
    save() {
        try {
            const data = JSON.stringify(this.projects);
            localStorage.setItem('game_blueprint_projects', data);
            // console.log(`[DataStore] save: saved ${this.projects.length} projects, total size=${(data.length / 1024).toFixed(1)}KB`);
        } catch (e) {
            console.error('[DataStore] save error:', e);
            Toast.show('保存失败，存储空间可能已满', 'error');
        }
    },

    /**
     * 获取所有项目
     */
    getProjects() {
        return [...this.projects];
    },

    /**
     * 根据ID获取项目
     */
    getProject(id) {
        return this.projects.find(p => p.id === id) || null;
    },

    /**
     * 新建项目
     */
    createProject(name, description = '') {
        const project = {
            id: this.generateId(),
            name: name || '未命名项目',
            version: '0.1',
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customSubTypes: [
                { id: 'normal', name: '普通' },
                { id: 'key', name: '关键' },
                { id: 'daily', name: '日常' },
                { id: 'weekly', name: '周常' }
            ],
            customResourceTypes: [
                { id: 'currency', name: '货币', icon: 'fa-coins', color: '#f59e0b' },
                { id: 'material', name: '养成材料', icon: 'fa-gem', color: '#8b5cf6' },
                { id: 'stamina', name: '体力类', icon: 'fa-bolt', color: '#06b6d4' }
            ],
            nodes: [],
            edges: []
        };
        this.projects.unshift(project);
        this.save();
        return project;
    },

    /**
     * 删除项目
     */
    deleteProject(id) {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    /**
     * 复制项目
     */
    duplicateProject(id) {
        const original = this.getProject(id);
        if (!original) return null;
        
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = this.generateId();
        copy.name = copy.name + ' (副本)';
        copy.updatedAt = new Date().toISOString();
        
        // 重新生成节点和边的ID
        const idMap = {};
        copy.nodes.forEach(node => {
            const oldId = node.id;
            node.id = this.generateId();
            idMap[oldId] = node.id;
        });
        copy.edges.forEach(edge => {
            edge.id = this.generateId();
            edge.source = idMap[edge.source];
            edge.target = idMap[edge.target];
        });
        
        this.projects.unshift(copy);
        this.save();
        return copy;
    },

    /**
     * 搜索项目
     */
    searchProjects(query) {
        if (!query.trim()) return this.getProjects();
        const q = query.toLowerCase();
        return this.projects.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.description && p.description.toLowerCase().includes(q))
        );
    },

    /**
     * 设置当前项目
     */
    setCurrentProject(id) {
        this.currentProjectId = id;
        this.undoStack = [];
        this.redoStack = [];
    },

    /**
     * 获取当前项目
     */
    getCurrentProject() {
        if (!this.currentProjectId) return null;
        return this.getProject(this.currentProjectId);
    },

    /**
     * 更新当前项目
     */
    updateCurrentProject(updates) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        Object.assign(project, updates, { updatedAt: new Date().toISOString() });
        this.save();
    },

    /**
     * 添加节点
     */
    addNode(nodeData) {
        const project = this.getCurrentProject();
        if (!project) {
            console.error('[DataStore] addNode: 没有当前项目！');
            return null;
        }
        
        console.log(`[DataStore] addNode: 在项目 "${project.name}" 中添加节点`, nodeData);
        
        // 保存历史状态用于撤销
        this.pushHistory();
        
        // 默认端口：新节点默认1个输入和1个输出（可后续删除为0）
        // 根级父节点自动分配颜色
        const colorPalette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
        const existingColors = project.nodes.filter(n => n.parentColor).map(n => n.parentColor);
        
        const node = {
            id: this.generateId(),
            name: nodeData.name || '新节点',
            type: nodeData.type || 'system',
            inputPorts: (nodeData.inputPorts && nodeData.inputPorts.length > 0) ? nodeData.inputPorts : [{ id: this.generatePortId(), name: '输入' }],
            outputPorts: (nodeData.outputPorts && nodeData.outputPorts.length > 0) ? nodeData.outputPorts : [{ id: this.generatePortId(), name: '输出' }],
            ...nodeData
        };
        
        // 根级系统节点（无parentId）自动分配未使用的颜色
        if (!node.parentId && !node.parentColor && node.type === 'system') {
            for (const c of colorPalette) {
                if (!existingColors.includes(c)) { node.parentColor = c; break; }
            }
            if (!node.parentColor) node.parentColor = colorPalette[existingColors.length % colorPalette.length];
            // 默认 role 为产出系统
            if (!node.role) node.role = 'output';
        }
        
        project.nodes.push(node);
        this.save();
        console.log(`[DataStore] addNode: 节点创建成功, id=${node.id}, 当前节点总数=${project.nodes.length}`);
        return node;
    },

    /**
     * 删除节点及其相关边
     */
    deleteNode(nodeId) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        this.pushHistory();
        
        project.nodes = project.nodes.filter(n => n.id !== nodeId);
        project.edges = project.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        this.save();
    },

    /**
     * 更新节点属性
     */
    updateNode(nodeId, updates) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        this.pushHistory();
        
        const node = project.nodes.find(n => n.id === nodeId);
        if (node) {
            Object.assign(node, updates);
            this.save();
        }
    },

    /**
     * 更新节点位置
     */
    updateNodePosition(nodeId, x, y) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        const node = project.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = x;
            node.y = y;
        }
    },

    /** 
     * 批量更新节点位置（拖拽结束时调用，不记录历史）
     */
    batchUpdatePositions(positions) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        positions.forEach(({id, x, y}) => {
            const node = project.nodes.find(n => n.id === id);
            if (node) {
                node.x = x;
                node.y = y;
            }
        });
        this.save();
    },

    /**
     * 添加边
     */
addEdge(sourceId, targetId, edgeData = {}) {
        const project = this.getCurrentProject();
        if (!project) return null;
        
        const sourcePortId = edgeData.sourcePortId || null;
        const targetPortId = edgeData.targetPortId || null;
        
        // 检查是否已存在完全相同的边（同一对具体端口之间）
        const exists = project.edges.some(e => 
            e.source === sourceId && 
            e.target === targetId && 
            e.sourcePortId === sourcePortId && 
            e.targetPortId === targetPortId
        );
        if (exists) {
            Toast.show('该端口关系已存在', 'warning');
            return null;
        }
        
        // 新规则：输入端口只能被一个输出端口连接
        // 如果输入端口已被占用，先删除旧连接
        if (targetPortId) {
            const occupiedEdge = project.edges.find(e => 
                e.target === targetId && 
                e.targetPortId === targetPortId && 
                e.source !== sourceId
            );
            if (occupiedEdge) {
                if (!confirm('该输入端口已被其他输出端口连接，是否断开旧连接并建立新连接？')) {
                    return null;
                }
                // 删除旧连接
                project.edges = project.edges.filter(e => e.id !== occupiedEdge.id);
            }
        }
        
        this.pushHistory();
        
        const edge = {
            id: this.generateId(),
            source: sourceId,
            target: targetId,
            type: edgeData.type || 'output',
            valueType: edgeData.valueType || 'fixed',
            // 分流配置
            splitType: edgeData.splitType || 'value', // value/percentage/percentage-amount
            splitValue: edgeData.splitValue || null,  // 数值或概率
            splitAmount: edgeData.splitAmount || 1, // 概率+数量模式的数量
            ...edgeData
        };

        project.edges.push(edge);
        this.save();
        return edge;
    },

    /**
     * 删除边
     */
    deleteEdge(edgeId) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        this.pushHistory();
        project.edges = project.edges.filter(e => e.id !== edgeId);
        this.save();
    },

    /**
     * 更新边属性
     */
    updateEdge(edgeId, updates) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        this.pushHistory();
        
        const edge = project.edges.find(e => e.id === edgeId);
        if (edge) {
            Object.assign(edge, updates);
            this.save();
        }
    },

    /**
     * 推入历史记录
     */
    pushHistory() {
        try {
            const project = this.getCurrentProject();
            if (!project) return;
            
            const snapshot = JSON.stringify({
                nodes: [...project.nodes],
                edges: [...project.edges]
            });
            
            this.undoStack.push(snapshot);
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }
            
            // 清空重做栈
            this.redoStack = [];
        } catch (e) {
            console.error('[DataStore] pushHistory error:', e);
        }
    },

    /**
     * 撤销
     */
    undo() {
        if (this.undoStack.length === 0) {
            Toast.show('没有可撤销的操作', 'info');
            return false;
        }
        
        const project = this.getCurrentProject();
        if (!project) return false;
        
        // 保存当前状态到重做栈
        this.redoStack.push(JSON.stringify({
            nodes: [...project.nodes],
            edges: [...project.edges]
        }));
        
        // 恢复上一个状态
        const snapshot = JSON.parse(this.undoStack.pop());
        project.nodes = snapshot.nodes;
        project.edges = snapshot.edges;
        this.save();
        
        return true;
    },

    /**
     * 重做
     */
    redo() {
        if (this.redoStack.length === 0) {
            Toast.show('没有可重做的操作', 'info');
            return false;
        }
        
        const project = this.getCurrentProject();
        if (!project) return false;
        
        // 保存当前状态到撤销栈
        this.undoStack.push(JSON.stringify({
            nodes: [...project.nodes],
            edges: [...project.edges]
        }));
        
        // 恢复重做的状态
        const snapshot = JSON.parse(this.redoStack.pop());
        project.nodes = snapshot.nodes;
        project.edges = snapshot.edges;
        this.save();
        
        return true;
    },

    /**
     * 导出数据为JSON
     */
    exportData(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            project
        };
    },

    /**
     * 导入JSON数据
     */
    importData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (!data.project) throw new Error('Invalid format');
            
            data.project.id = this.generateId(); // 分配新ID避免冲突
            data.project.name += ' (导入)';
            data.project.updatedAt = new Date().toISOString();
            
            this.projects.unshift(data.project);
            this.save();
            
            return data.project;
        } catch (e) {
            console.error('Import failed:', e);
            return null;
        }
    },

    // ==================== 自定义资源类型管理 ====================

    /**
     * 添加自定义资源类型
     */
    addResourceType(typeData) {
        const project = this.getCurrentProject();
        if (!project) return null;
        
        if (!project.customResourceTypes) project.customResourceTypes = [];
        
        // 检查重复名称
        if (project.customResourceTypes.some(t => t.name === typeData.name)) {
            Toast.show('该资源类型已存在', 'warning');
            return null;
        }
        
        this.pushHistory();
        
        const newType = {
            id: 'rt_' + Date.now(),
            name: typeData.name || '新资源类型',
            icon: typeData.icon || 'fa-box',
            color: typeData.color || '#64748b'
        };
        
        project.customResourceTypes.push(newType);
        this.save();
        return newType;
    },

    /**
     * 删除自定义资源类型
     */
    removeResourceType(typeId) {
        const project = this.getCurrentProject();
        if (!project || !project.customResourceTypes) return;
        
        const type = project.customResourceTypes.find(t => t.id === typeId);
        if (!type) return;
        
        // 检查是否有资源节点使用此类型
        const usedBy = project.nodes.filter(n => n.type === 'resource' && n.resourceType === typeId);
        
        this.pushHistory();
        project.customResourceTypes = project.customResourceTypes.filter(t => t.id !== typeId);
        
        // 将使用此类型的节点设为未分类或删除（这里保留但标记）
        usedBy.forEach(n => { n.resourceType = undefined; });
        
        this.save();
    },

    /**
     * 创建资源节点（从资源库拖拽到画布时调用，默认不显示、带1输入+1输出端口）
     */
    addResourceNode(name, resourceTypeId) {
        const project = this.getCurrentProject();
        if (!project) return null;
        
        // 查找资源类型信息
        const resType = project.customResourceTypes?.find(t => t.id === resourceTypeId);
        
        this.pushHistory();
        
        const node = {
            id: this.generateId(),
            name: name,  // 使用传入名称（通常为"类型名 + 实例"）
            type: 'resource',
            resourceType: resourceTypeId,
            rarity: 'common',
            x: 200 + Math.random() * 400,
            y: 350 + Math.random() * 100,
            tags: [],
            description: '',
            inputPorts: [{ id: this.generatePortId(), name: '输入' }],
            outputPorts: [{ id: this.generatePortId(), name: '输出' }],
            visible: true,       // 默认显示卡片
            quantity: null,      // 默认未配置数量
            nodeColor: resType?.color || '#f59e0b'  // 继承类型颜色
        };
        
        project.nodes.push(node);
        this.save();
        return node;
    },

    /**
     * 更新资源节点可见性和数量
     */
    updateResourceNodeVisibility(nodeId, visible, quantity) {
        const project = this.getCurrentProject();
        if (!project) return;
        
        const node = project.nodes.find(n => n.id === nodeId);
        if (!node || node.type !== 'resource') return;
        
        node.visible = !!visible;
        node.quantity = quantity !== '' ? (quantity !== null && quantity !== undefined ? Number(quantity) : null) : null;
        
        // 如果设置了数量，自动显示
        if (node.quantity !== null && node.quantity > 0) {
            node.visible = true;
        }
        
        this.save();
    }
};
