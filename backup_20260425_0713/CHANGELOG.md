# 游戏资源流向蓝图工具 - 更新日志

## v1.1.1 (2026-04-25)

### 新增功能：边的变暗效果

当节点被高亮时，非高亮关联的边会变暗显示，提高视觉清晰度。

#### 1. 边的变暗效果
- 高亮边：正常显示 + 流动动画
- 非高亮边：透明度降低（opacity: 0.15）

#### 实现方式
在 `_renderEdgesWithRealPositions` 方法中：
```javascript
const isDimmed = this.selectedNode && !isHighlighted && !isSelected;
let styleClass = 'edge-element';
if (isSelected) styleClass += ' selected';
else if (isHighlighted) styleClass += ' highlighted flowing';
else if (isDimmed) styleClass += ' path-dimmed';

let opacity = isDimmed ? 0.15 : 1;
// 应用到边的stroke-opacity和style
```

---

## v1.1.0 (2026-04-25)

### 新增功能：智能高亮与链路追溯

#### 1. 角色类型系统
根级父节点新增**角色类型**属性：
- `output`（产出系统，默认）
- `consume`（消耗系统）

设置位置：属性面板 → 角色定义区域

#### 2. 单向链路追溯高亮

| 点击节点类型 | 高亮逻辑 | 追溯方向 |
|-------------|---------|---------|
| **产出系统** | 高亮该系统 → 子节点 → 资源 → 消耗系统 | 下游追溯 |
| **消耗系统** | 高亮该系统 → 资源 → 产出系统 | 上游追溯 |
| **资源节点** | 高亮上游 + 下游全链路 | 双向追溯 |

#### 3. 边的流动动画效果
高亮节点之间的边显示虚线流动动画。

---

## v1.0.1 (2026-04-25)

### 资源节点卡优化
- 资源节点卡汇总值显示
- 卡片高度自适应
- 边选择时自动打开属性面板

---

## v1.0.0 (2026-04-24)

### 初始版本
- 核心编辑功能
- 自动布局算法
- 深色/浅色主题
- 小地图导航
- 资源分析页面