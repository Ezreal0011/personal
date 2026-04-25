# 游戏资源流向蓝图工具 - 更新日志

## v1.1.0 (2026-04-25)

### 新增功能：智能高亮与链路追溯

#### 1. 角色类型系统
在根级父节点（无父节点的顶级系统节点）中新增**角色类型**属性，用于区分产出系统和消耗系统。

**属性位置**：属性面板 → 角色定义区域

**属性值**：
- `output`（产出系统，默认）：表示该系统产出资源
- `consume`（消耗系统）：表示该系统消耗资源

**数据存储**：
- 根级系统节点新增 `role` 字段
- 新建根级系统节点时自动设置为 `output`（产出系统）
- 旧项目数据通过迁移自动添加默认角色类型

#### 2. 单向链路追溯高亮

根据点击的节点类型和角色，执行不同的高亮逻辑：

| 点击节点类型 | 高亮逻辑 | 追溯方向 |
|-------------|---------|---------|
| **产出系统** | 高亮该系统 → 子节点 → 产出的资源 → 消耗这些资源的系统 | 下游追溯 |
| **消耗系统** | 高亮该系统 → 消耗的资源 → 产出这些资源的系统 | 上游追溯 |
| **资源节点** | 高亮上游产出系统 + 下游消耗系统 | 双向追溯 |
| **普通子节点** | 根据根父节点的角色决定追溯方向 | 继承父节点角色 |

#### 3. 边的流动动画效果

当节点被高亮时，连接高亮节点之间的边会显示**流动动画效果**：
- 虚线流动样式（stroke-dasharray）
- 颜色发光效果（drop-shadow filter）
- 动画持续流动（animation）

### 技术实现细节

#### 数据结构

**节点角色类型**（根级系统节点）：
```javascript
{
    id: "xxx",
    name: "主线地图",
    type: "system",
    parentId: null,           // 根节点
    role: "output",           // 角色类型：output产出/consume消耗
    parentColor: "#3b82f6",   // 分组颜色
    // ...
}
```

**边类型**：
- `output`：产出关系（产出系统 → 资源 → 消耗系统）
  - 在当前实现中，资源指向消耗系统也使用output边
- `consume`：（保留，暂未使用）

#### 核心算法

**1. 获取根父节点**（`_getRootParent`）：
```javascript
_getRootParent(node, project) {
    if (!node.parentId) return node; // 自身就是根节点
    // 递归向上查找
    let current = node;
    while (current.parentId) {
        const parent = project.nodes.find(n => n.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    return current;
}
```

**2. 产出系统下游追溯**（`_getDownstreamNodesFromStart`）：
- 从选中的产出系统开始
- 查找所有子节点（直接子节点）
- 查找产出的资源（output边，source=产出系统）
- 从资源继续追溯到消耗系统（output边，source=资源）

**3. 消耗系统上游追溯**（`_getUpstreamNodesFromStart`）：
- 从选中的消耗系统开始
- 查找消耗的资源（output边，target=消耗系统）
- 从资源向上追溯到产出系统（output边，target=资源）
- 继续追溯产出系统的根父节点

**4. 资源节点全链路**（`_getResourceFullPath`）：
- 上游：找到产出该资源的系统（output边）
- 下游：找到消耗该资源的系统（output边）

#### 关键文件修改

1. **index.html**
   - 在属性面板"角色定义"区域添加单选按钮（产出系统/消耗系统）

2. **js/data.js**
   - 迁移函数：为旧根节点添加默认`role: 'output'`
   - 新建节点：为根级系统节点自动设置`role: 'output'`
   - 示例项目：更新节点数据添加role属性

3. **js/canvas.js**
   - 新增 `_getRootParent()` - 获取节点的根父节点
   - 新增 `_getDownstreamNodesFromStart()` - 产出系统下游追溯
   - 新增 `_getUpstreamNodesFromStart()` - 消耗系统上游追溯
   - 新增 `_getResourceFullPath()` - 资源节点全链路
   - 修改 `_createNodeElement()` - 实现高亮逻辑
   - 修改 `_getHighlightedNodeIds()` - 边的样式计算
   - 修改 `_renderEdgesWithRealPositions()` - 添加流动动画

4. **css/styles.css**
   - 新增 `.edge-element.highlighted` 和 `.edge-element.highlighted.flowing` 样式
   - 新增 `@keyframes edge-flow` 流动动画

### 使用说明

1. **设置角色类型**：
   - 点击根级系统节点（如"主线地图"）
   - 在右侧属性面板中找到"角色定义"区域
   - 选择"产出系统"或"消耗系统"

2. **查看链路**：
   - 点击产出系统 → 显示资源产出链路
   - 点击消耗系统 → 显示资源消耗来源
   - 点击资源节点 → 显示上下游全链路

3. **边的方向**：
   - 产出关系：从产出系统（source）指向资源（target）
   - 消耗关系：从资源（source）指向消耗系统（target）

### 注意事项

- 边的类型统一使用 `output`
- 消耗关系通过 `output` 边且 `target` 是消耗系统来表示
- 追溯逻辑会自动处理父子节点关系
- 高亮时非相关节点会变暗，保持视觉清晰