# 游戏资源流向蓝图工具

一个专为游戏策划设计的可视化资源流向编辑器，用于设计、分析和管理游戏内的资源产出与消耗关系。

![Game Resource Blueprint](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能特性

### 核心功能
- **可视化节点编辑** - 拖拽式节点布局，直观的资源关系展示
- **系统树管理** - 层级化的游戏系统结构（主线地图 → 章节 → 关卡等）
- **资源库管理** - 货币、养成材料、体力类资源的分类管理
- **关系连线** - 产出/消耗关系的贝塞尔曲线连线，支持数值标注
- **属性面板** - 节点和关系的详细属性编辑

### 高级功能
- **自动布局** - BFS层次算法，一键整理节点位置
- **智能对齐线** - 拖拽时自动显示对齐辅助线
- **网格吸附** - 节点拖拽自动对齐到20px网格
- **多选操作** - Ctrl+点击多选，批量移动节点
- **撤销/重做** - 最多50步历史记录
- **小地图导航** - 实时缩略图 + 视口框定位
- **主题切换** - 浅色/深色模式自由切换
- **导入/导出** - JSON格式数据备份与恢复
- **资源分析页** - 以资源为中心的辐射状关系图分析

## 快速开始

### 安装与运行

```bash
# 进入项目目录
cd game-resource-blueprint

# 方式一：使用 Python 启动（推荐）
python -m http.server 3000

# 方式二：使用 Node.js serve
npm install
npm start
```

打开浏览器访问 `http://localhost:3000`

### 项目结构

```
game-resource-blueprint/
├── index.html          # 主页面
├── css/
│   └── styles.css      # 样式表（含深色主题）
├── js/
│   ├── data.js         # 数据管理模块
│   ├── canvas.js       # 画布渲染引擎
│   └── app.js          # 应用主逻辑
├── package.json        # 项目配置
└── README.md           # 本文档
```

## 使用指南

### 1. 创建项目

1. 在首页点击「新建项目」按钮
2. 输入项目名称和描述
3. 确认后进入编辑器页面

### 2. 添加系统节点

- 点击左侧面板「系统树」标签 → 「新建系统」
- 或在画布右键菜单中选择相关选项
- 系统节点支持层级关系（父级/子级）
- 子类型：普通 / 关键 / 日常 / 周常

### 3. 添加资源节点

- 切换到左侧面板「资源库」标签 → 「新建资源」
- 填写资源信息：
  - 名称、类型（货币/养成材料/体力类）、稀有度
- 支持从资源库拖拽到画布放置

### 4. 建立关系

- **方式一**：右键点击源节点 → 选择「建立关系」→ 点击目标节点
- **方式二**：选中节点后按住连接模式依次点击两个节点

关系类型：
| 类型 | 颜色 | 说明 |
|------|------|------|
| 产出 | 绿色 | 系统产出该资源 |
| 消耗 | 红色 | 系统消耗该资源 |
| 需求 | 灰色 | 解锁条件 |
| 解锁 | 灰色 | 前置依赖 |

### 5. 自动布局

按 **L 键** 或点击工具栏的「自动布局」按钮：
- 使用 BFS 算法计算节点层级深度
- 系统节点按层均匀分布
- 资源节点按类型分组排列
- 自动调整视图以适配所有内容

### 6. 资源分析

点击工具栏「资源分析」进入分析页面：
- 左侧：所有资源列表（支持筛选搜索）
- 中间：以选中资源为中心的辐射图
  - 绿色箭头指向 = 来源系统（产出方）
  - 红色箭头指向 = 目标系统（消耗方）
- 右侧：资源详情和关联统计

## 快捷键列表

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存项目 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | 重做 |
| `Delete` / `Backspace` | 删除选中元素 |
| `L` | 自动布局 |
| `R` | 重置视图 |
| `Esc` | 取消选择/关闭弹窗/退出连线模式 |
| `Ctrl+Click` | 多选节点 |
| `双击节点` | 编辑属性 |

## 数据格式

导出的 JSON 文件结构：

```json
{
  "id": "uuid",
  "name": "项目名称",
  "version": "1.0",
  "description": "描述",
  "nodes": [
    {
      "id": "uuid",
      "name": "节点名称",
      "type": "system|resource",
      // 系统节点特有
      "level": 1,
      "subType": "normal|key|daily|weekly",
      "parentId": null,
      // 资源节点特有
      "resourceType": "currency|material|stamina",
      "rarity": "common|uncommon|rare|epic|legendary",
      // 通用
      "x": 100, "y": 200,
      "tags": [],
      "description": ""
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source": "sourceNodeId",
      "target": "targetNodeId",
      "type": "output|consume|require|unlock",
      "valueType": "fixed|range|dynamic|percentage",
      "value": 100,
      "minValue": 50,
      "maxValue": 150,
      "condition": ""
    }
  ]
}
```

## 技术特性

- **纯前端实现** - 无需后端服务器，直接浏览器运行
- **本地存储** - 数据自动保存到 localStorage
- **SVG 渲染** - 贝塞尔曲线连线，矢量级清晰度
- **响应式设计** - 适配不同屏幕尺寸
- **XSS 防护** - 所有用户输入经过 HTML 转义处理
- **性能优化** - DOM 操作优化，支持大量节点

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 开发说明

本项目使用原生 HTML/CSS/JavaScript 开发，无构建工具依赖：

- **CSS 变量** 用于主题系统和颜色管理
- **ES6+ 模块化** 组织代码（DataStore / Canvas / App）
- **Font Awesome** 提供图标支持
- **Canvas API** 渲染小地图

### 扩展开发

添加新节点类型示例：

```javascript
// js/data.js - DataStore.addNode()
const node = {
    id: generateId(),
    name: '新节点',
    type: 'custom',  // 新类型
    x: 300, y: 200,
    tags: [], description: ''
};

// css/styles.css - 添加样式
.canvas-node.custom-node { border-color: #orange; }

// js/canvas.js - 更新渲染逻辑
```

## 版本历史

### v1.0.0 (2026-04-24)
- 初始版本发布
- 核心编辑功能完整实现
- 自动布局算法
- 深色/浅色主题切换
- 智能对齐线和网格吸附
- 节点多选批量操作
- 小地图导航
- 资源分析页面

## License

MIT License

---

Made with ❤️ for Game Designers
