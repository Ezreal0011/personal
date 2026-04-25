const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, PageOrientation } = require('docx');
const fs = require('fs');

// Create the document
const doc = new Document({
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        children: [
            // Title
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun({ text: "游戏资源流向蓝图工具", bold: true, size: 44 })]
            }),
            new Paragraph({ children: [new TextRun({ text: "项目说明文档", size: 28 })] }),
            new Paragraph({ children: [new TextRun({ text: "版本: v1.1.1", size: 24, color: "666666" })] }),
            new Paragraph({ children: [new TextRun({ text: "更新日期: 2026-04-25", size: 24, color: "666666" })] }),

            // Overview
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "一、项目概述", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "游戏资源流向蓝图工具是一款专为游戏策划设计的可视化资源流向编辑器，用于设计、分析和管理游戏内的资源产出与消耗关系。", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "通过直观的节点和连线界面，帮助策划人员构建完整的资源流转图谱。", size: 22 })] }),

            // Core Features
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "二、核心功能", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "1. 可视化节点编辑", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 拖拽式节点布局，直观的资源关系展示", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 系统节点：表示游戏中的各个系统（如主线地图、人物养成）", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 资源节点：表示游戏资源（如金币、经验书、体力）", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "2. 关系连线", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 产出关系（绿色）：系统产出资源", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 消耗关系（红色）：系统消耗资源", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 贝塞尔曲线连线，支持数值标注", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "3. 角色类型系统", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "根级系统节点可设置为「产出系统」或「消耗系统」：", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 产出系统（output）：表示该系统产出资源", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 消耗系统（consume）：表示该系统消耗资源", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "设置位置：点击根级节点 → 右侧属性面板 → 角色定义区域", size: 22, color: "666666" })] }),

            new Paragraph({ children: [new TextRun({ text: "4. 智能高亮与链路追溯", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "点击不同节点类型，自动追溯相关链路：", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 点击产出系统：显示下游链路（产出→资源→消耗）", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 点击消耗系统：显示上游链路（消耗←资源←产出）", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 点击资源节点：显示上下游全链路", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 非相关节点和边会变暗，保持视觉清晰", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "5. 边的流动动画效果", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "高亮节点之间的边会显示虚线流动动画，增强方向感", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "6. 自动布局（BFS算法）", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "按L键或点击工具栏按钮，自动整理节点布局", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "7. 撤销/重做", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "支持Ctrl+Z撤销、Ctrl+Y重做，最多50步历史", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "8. 小地图导航", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "右下角实时缩略图，支持快速定位", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "9. 主题切换", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "支持浅色/深色模式自由切换", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "10. 导入/导出", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "JSON格式数据备份与恢复", size: 22 })] }),

            // Data Structure
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "三、数据结构", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "节点数据格式：", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "{", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  id: 'uuid',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  name: '节点名称',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  type: 'system' | 'resource',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  role: 'output' | 'consume',  // 仅根级系统节点", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  parentId: '父节点ID',       // 有父节点为子节点", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  parentColor: '#颜色',       // 分组颜色", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  x: 100, y: 200,         // 坐标", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  inputPorts: [...],       // 输入端口", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  outputPorts: [...]       // 输出端口", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "}", size: 20, font: "Consolas" })] }),

            new Paragraph({ children: [new TextRun({ text: "边数据格式：", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "{", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  id: 'uuid',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  source: '源节点ID',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  target: '目标节点ID',", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  type: 'output',          // 产出/消耗关系", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  valueType: 'fixed',       // 固定值/范围值/百分比", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  value: 100,            // 数值", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "  condition: '条件'       // 备注", size: 20, font: "Consolas" })] }),
            new Paragraph({ children: [new TextRun({ text: "}", size: 20, font: "Consolas" })] }),

            // Usage
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "四、使用指南", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "1. 创建系统节点", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "点击左侧「系统树」→ 「新建系统」，填写名称并选择父节点", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "2. 创建资源节点", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "点击左侧「资源库」→ 「新建资源」，或从资源类型拖拽到画布", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "3. 建立关系", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "拖拽节点的输出端口到目标节点的输入端口，即可创建连线", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "4. 设置角色类型", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "点击根级系统节点，在属性面板「角色定义」区域选择「产出系统」或「消耗系统」", size: 22 })] }),

            new Paragraph({ children: [new TextRun({ text: "5. 查看链路", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "点击任意节点，高亮显示相关链路，非相关元素变暗", size: 22 })] }),

            // Shortcuts
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "五、快捷键", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "Ctrl+S   保存项目", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Ctrl+Z   撤销", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Ctrl+Y   重做", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "L         自动布局", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "R         重置视图", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Delete    删除选中", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Esc       取消选择", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "双击节点   编辑属性", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Ctrl+点击  多选节点", size: 22 })] }),

            // Technical
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "六、技术特性", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "• 纯前端实现 - 无需后端服务器，直接浏览器运行", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 本地存储 - 数据自动保存到localStorage", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• SVG渲染 - 贝塞尔曲线连线，矢量级清晰度", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 响应式设计 - 适配不同屏幕尺寸", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• XSS防护 - 所有用户输入经过HTML转义处理", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 性能优化 - DOM操作优化，支持大量节点", size: 22 })] }),

            // Browser Compatibility
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "七、浏览器兼容性", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Chrome 80+ / Firefox 75+ / Safari 13+ / Edge 80+", size: 22 })] }),

            // Version History
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "八、版本历史", bold: true })] }),
            
            new Paragraph({ children: [new TextRun({ text: "v1.1.1 (2026-04-25)", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 新增边的变暗效果，非高亮边透明度降低", size: 22 })] }),
            
            new Paragraph({ children: [new TextRun({ text: "v1.1.0 (2026-04-25)", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 新增角色类型系统（产出/消耗）", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 新增智能高亮与单向链路追溯", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 新增边的流动动画效果", size: 22 })] }),
            
            new Paragraph({ children: [new TextRun({ text: "v1.0.1 (2026-04-25)", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 资源节点卡汇总值显示", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 卡片高度自适应", size: 22 })] }),
            
            new Paragraph({ children: [new TextRun({ text: "v1.0.0 (2026-04-24)", bold: true, size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "• 初始版本发布", size: 22 })] }),

            // Footer
            new Paragraph({ children: [new TextRun({ text: "", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Made with ❤️ for Game Designers", size: 20, color: "999999" })] }),
        ]
    }]
});

// Generate and save
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('C:\\Users\\Administrator\\Desktop\\游戏资源流向蓝图工具_项目说明文档.docx', buffer);
    console.log('Document created successfully!');
}).catch(err => {
    console.error('Error:', err);
});