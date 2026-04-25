// 示例项目数据 - 游戏资源流向图
const EXAMPLE_PROJECT = {
  id: "zjcs_example",
  name: "综合游戏资源关系图",
  version: "1.0",
  description: "综合游戏资源流向示例，包含主线地图、家园系统、副本系统、商店、抽奖系统、人物养成等模块",
  createdAt: "2026-04-24T19:37:57.175Z",
  updatedAt: new Date().toISOString(),
  customSubTypes: [
    { id: 'normal', name: '普通' },
    { id: 'key', name: '关键' },
    { id: 'daily', name: '日常' },
    { id: 'weekly', name: '周常' }
  ],
  customResourceTypes: [
    { id: 'currency', name: '金币', icon: 'fa-coins', color: '#f59e0b' },
    { id: 'material', name: '粗矿', icon: 'fa-gem', color: '#8b5cf6' },
    { id: 'rt_1777061005955', name: '精华', icon: 'fa-gem', color: '#3b82f6' },
    { id: 'rt_1777061035184', name: '时之沙', icon: 'fa-gem', color: '#06b6d4' },
    { id: 'rt_1777061058973', name: '石头', icon: 'fa-gem', color: '#64748b' },
    { id: 'rt_1777061065682', name: '木头', icon: 'fa-gem', color: '#84cc16' },
    { id: 'rt_1777061085778', name: '装备', icon: 'fa-gem', color: '#ef4444' },
    { id: 'rt_1777061096080', name: '技能', icon: 'fa-gem', color: '#ec4899' },
    { id: 'rt_1777061108365', name: '遗物', icon: 'fa-gem', color: '#f59e0b' },
    { id: 'rt_1777061118876', name: '伙伴礼物', icon: 'fa-gem', color: '#10b981' },
    { id: 'rt_1777061689169', name: '宠物粮', icon: 'fa-box', color: '#84cc16' },
    { id: 'rt_1777061775098', name: '经验', icon: 'fa-box', color: '#22c55e' },
    { id: 'rt_1777063191060', name: '精锻石', icon: 'fa-box', color: '#94a3b8' },
    { id: 'rt_1777063339210', name: '耀星', icon: 'fa-coins', color: '#f59e0b' },
    { id: 'rt_1777063369416', name: '晨星', icon: 'fa-coins', color: '#fbbf24' },
    { id: 'rt_1777064222270', name: '体力', icon: 'fa-bolt', color: '#06b6d4' },
    { id: 'rt_1777064407660', name: '突破材料', icon: 'fa-bolt', color: '#8b5cf6' },
    { id: 'rt_1777065336031', name: '素材道具', icon: 'fa-star', color: '#a855f7' },
    { id: 'rt_1777065827921', name: '祈愿卡', icon: 'fa-box', color: '#ec4899' },
    { id: 'rt_1777065834706', name: '女神卡', icon: 'fa-box', color: '#f43f5e' },
    { id: 'rt_1777065844131', name: '结缘绳', icon: 'fa-box', color: '#fb7185' },
    { id: 'rt_1777066051366', name: '宠物', icon: 'fa-box', color: '#14b8a6' }
  ],
  nodes: [
    {
      id: "id_1777059533026_3gpa0oeaw",
      name: "主线地图探索",
      type: "system",
      inputPorts: [{ id: "p_deal47", name: "输入" }],
      outputPorts: [{ id: "p_gzxfjc", name: "输出", portType: "value" }],
      parentId: null,
      subType: "normal",
      level: 1,
      x: 468.83,
      y: 256.55,
      tags: [],
      description: "",
      parentColor: "#3b82f6",
      role: "output"
    },
    {
      id: "id_1777060551549_t8axkdvgo",
      name: "打怪",
      type: "system",
      inputPorts: [{ id: "p_big8ov", name: "输出" }],
      outputPorts: [
        { id: "p_jq0o8v", name: "精华", portType: "value" },
        { id: "p_evy81x", name: "人物突破材料", portType: "value" }
      ],
      parentId: "id_1777059533026_3gpa0oeaw",
      subType: "normal",
      level: 2,
      x: 658.5,
      y: 912.42,
      tags: [],
      description: ""
    },
    {
      id: "id_1777060576963_utxfmrdlh",
      name: "采集",
      type: "system",
      inputPorts: [{ id: "p_cp0p5u", name: "输出" }],
      outputPorts: [
        { id: "p_kkqv7j", name: "精华", portType: "value" },
        { id: "p_mk5h8z", name: "粗矿", portType: "value" },
        { id: "p_s6vr85", name: "金币", portType: "value" },
        { id: "p_l3w3gw", name: "时之沙", portType: "value" }
      ],
      parentId: "id_1777059533026_3gpa0oeaw",
      subType: "normal",
      level: 2,
      x: 662.78,
      y: 775.29,
      tags: [],
      description: ""
    },
    {
      id: "id_1777060673981_cuxkpniak",
      name: "家园系统",
      type: "system",
      inputPorts: [{ id: "p_fb6n5e", name: "输入" }],
      outputPorts: [{ id: "p_u14ccn", name: "输出", portType: "value" }],
      parentId: null,
      subType: "normal",
      level: 1,
      x: 346.5,
      y: 312.28,
      tags: [],
      description: "",
      parentColor: "#8b5cf6",
      role: "output"
    },
    {
      id: "id_1777060693614_8tigzbc7r",
      name: "床",
      type: "system",
      inputPorts: [{ id: "p_tsw7te", name: "输入" }],
      outputPorts: [{ id: "p_8cti97", name: "经验", portType: "value" }],
      parentId: "id_1777060673981_cuxkpniak",
      subType: "normal",
      level: 2,
      x: 655.41,
      y: 266.24,
      tags: [],
      description: ""
    },
    {
      id: "id_1777060701577_8hhuxgsrb",
      name: "推车",
      type: "system",
      inputPorts: [
        { id: "p_khvsto", name: "输出" },
        { id: "p_t24kof", name: "输出" }
      ],
      outputPorts: [
        { id: "p_l21m06", name: "金币", portType: "value" },
        { id: "p_4q5qo0", name: "木头", portType: "value" },
        { id: "p_gxapgl", name: "石头", portType: "value" },
        { id: "p_7th8gy", name: "粗矿", portType: "value" },
        { id: "p_bfli7t", name: "时之沙", portType: "value" },
        { id: "p_l1m70o", name: "装备", portType: "value" },
        { id: "p_iit6v6", name: "宠物粮", portType: "value" },
        { id: "p_280n2l", name: "精华", portType: "value" }
      ],
      parentId: "id_1777060673981_cuxkpniak",
      subType: "normal",
      level: 2,
      x: 660.21,
      y: 395.09,
      tags: [],
      description: ""
    },
    {
      id: "id_1777060756222_9sn2ox0po",
      name: "副本系统",
      type: "system",
      inputPorts: [{ id: "p_ffefs5", name: "输入" }],
      outputPorts: [{ id: "p_xgs8tl", name: "输出", portType: "value" }],
      parentId: null,
      subType: "normal",
      level: 1,
      x: 413.28,
      y: 299.02,
      tags: [],
      description: "",
      parentColor: "#10b981",
      role: "output"
    },
    {
      id: "id_1777066325991_tpk140ug2",
      name: "人物养成",
      type: "system",
      inputPorts: [{ id: "p_vnk9ry", name: "输入" }],
      outputPorts: [{ id: "p_594227", name: "输出", portType: "value" }],
      parentId: null,
      subType: "normal",
      level: 1,
      x: 485.59,
      y: 227.63,
      tags: [],
      description: "",
      parentColor: "#ec4899",
      role: "consume"
    },
    {
      id: "id_1777066335147_kprnfjwvw",
      name: "人物升级",
      type: "system",
      inputPorts: [{ id: "p_d4wdi2", name: "经验" }],
      outputPorts: [{ id: "p_4n6dnf", name: "输出", portType: "value" }],
      parentId: "id_1777066325991_tpk140ug2",
      subType: "normal",
      level: 2,
      x: 1486.02,
      y: 452.15,
      tags: [],
      description: ""
    },
    {
      id: "id_1777066341946_2ydleumwo",
      name: "人物突破",
      type: "system",
      inputPorts: [
        { id: "p_l6tp8c", name: "输出" },
        { id: "p_x5kru3", name: "人物突破材料" }
      ],
      outputPorts: [{ id: "p_o0dsam", name: "输出", portType: "value" }],
      parentId: "id_1777066325991_tpk140ug2",
      subType: "normal",
      level: 2,
      x: 1488.44,
      y: 536.77,
      tags: [],
      description: ""
    },
    // 资源节点 - 金币
    {
      id: "id_1777061133582_x3553tjdy",
      name: "金币",
      type: "resource",
      resourceType: "currency",
      rarity: "common",
      x: 1025.77,
      y: 473.07,
      tags: [],
      description: "",
      inputPorts: [
        { id: "p_icfqr7", name: "金币" },
        { id: "p_yk0qvh", name: "金币" },
        { id: "p_27ocos", name: "金币" },
        { id: "p_zhfdh3", name: "金币" },
        { id: "p_kkigi2", name: "输出" }
      ],
      outputPorts: [{ id: "p_6msv1i", name: "输出", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#f59e0b"
    },
    // 资源节点 - 粗矿
    {
      id: "id_1777061139321_hi7jwon66",
      name: "粗矿",
      type: "resource",
      resourceType: "material",
      rarity: "common",
      x: 1261.77,
      y: 538.89,
      tags: [],
      description: "",
      inputPorts: [
        { id: "p_x715up", name: "粗矿" },
        { id: "p_ffkuqr", name: "粗矿" },
        { id: "p_cl9930", name: "粗矿" }
      ],
      outputPorts: [{ id: "p_3fy2uf", name: "输出", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#8b5cf6"
    },
    // 资源节点 - 精华
    {
      id: "id_1777061146111_ocg00thcn",
      name: "精华",
      type: "resource",
      resourceType: "rt_1777061005955",
      rarity: "common",
      x: 1259.09,
      y: 651.74,
      tags: [],
      description: "",
      inputPorts: [
        { id: "p_yn8inn", name: "精华" },
        { id: "p_fkwxng", name: "精华" },
        { id: "p_m4i28e", name: "精华" },
        { id: "p_iaw31w", name: "精华" },
        { id: "p_72vpzf", name: "精华" }
      ],
      outputPorts: [{ id: "p_k7vbz5", name: "输出", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#3b82f6"
    },
    // 资源节点 - 经验
    {
      id: "id_1777061778030_xl5cgwc6h",
      name: "经验",
      type: "resource",
      resourceType: "rt_1777061775098",
      rarity: "common",
      x: 1011,
      y: 304.31,
      tags: [],
      description: "",
      inputPorts: [{ id: "p_9k2xo3", name: "经验" }],
      outputPorts: [{ id: "p_kl250b", name: "经验", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#22c55e"
    },
    // 资源节点 - 体力
    {
      id: "id_1777064225132_bjjfk04ta",
      name: "体力",
      type: "resource",
      resourceType: "rt_1777064222270",
      rarity: "common",
      x: 434.93,
      y: 873.45,
      tags: [],
      description: "",
      inputPorts: [{ id: "p_w76u0e", name: "输入" }],
      outputPorts: [{ id: "p_gg9rk3", name: "输出", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#06b6d4"
    },
    // 资源节点 - 突破材料
    {
      id: "id_1777064416398_dhyt2y2w4",
      name: "人物突破材料",
      type: "resource",
      resourceType: "rt_1777064407660",
      rarity: "common",
      x: 1267.98,
      y: 1053.17,
      tags: [],
      description: "",
      inputPorts: [{ id: "p_w46pbu", name: "人物突破材料" }],
      outputPorts: [{ id: "p_i8cq6f", name: "人物突破材料", portType: "value" }],
      visible: true,
      quantity: null,
      nodeColor: "#8b5cf6"
    }
  ],
  edges: [
    // 推车产出
    { id: "e1", source: "id_1777060701577_8hhuxgsrb", target: "id_1777061133582_x3553tjdy", type: "output", sourcePortId: "p_l21m06", targetPortId: "p_icfqr7", valueType: "fixed", value: 100 },
    { id: "e2", source: "id_1777060701577_8hhuxgsrb", target: "id_1777061146111_ocg00thcn", type: "output", sourcePortId: "p_280n2l", targetPortId: "p_yn8inn", valueType: "fixed", value: 10 },
    // 床产出经验
    { id: "e3", source: "id_1777060693614_8tigzbc7r", target: "id_1777061778030_xl5cgwc6h", type: "output", sourcePortId: "p_8cti97", targetPortId: "p_9k2xo3", valueType: "fixed", value: 50 },
    // 体力消耗
    { id: "e4", source: "id_1777064225132_bjjfk04ta", target: "id_1777060576963_utxfmrdlh", type: "output", sourcePortId: "p_gg9rk3", targetPortId: "p_cp0p5u", valueType: "fixed", value: 10 },
    { id: "e5", source: "id_1777064225132_bjjfk04ta", target: "id_1777060551549_t8axkdvgo", type: "output", sourcePortId: "p_gg9rk3", targetPortId: "p_big8ov", valueType: "fixed", value: 15 },
    // 打怪产出
    { id: "e6", source: "id_1777060551549_t8axkdvgo", target: "id_1777064416398_dhyt2y2w4", type: "output", sourcePortId: "p_evy81x", targetPortId: "p_w46pbu", valueType: "fixed", value: 5 },
    { id: "e7", source: "id_1777060551549_t8axkdvgo", target: "id_1777061146111_ocg00thcn", type: "output", sourcePortId: "p_jq0o8v", targetPortId: "p_iaw31w", valueType: "fixed", value: 8 },
    // 经验消耗（人物升级）
    { id: "e8", source: "id_1777061778030_xl5cgwc6h", target: "id_1777066335147_kprnfjwvw", type: "output", sourcePortId: "p_kl250b", targetPortId: "p_d4wdi2", valueType: "fixed", value: 100, color: "#ec4899" },
    // 突破材料消耗（人物突破）
    { id: "e9", source: "id_1777064416398_dhyt2y2w4", target: "id_1777066341946_2ydleumwo", type: "output", sourcePortId: "p_i8cq6f", targetPortId: "p_x5kru3", valueType: "fixed", value: 20, color: "#ec4899" },
    // 金币消耗
    { id: "e10", source: "id_1777061133582_x3553tjdy", target: "id_1777066341946_2ydleumwo", type: "output", sourcePortId: "p_6msv1i", targetPortId: "p_l6tp8c", valueType: "fixed", value: 1000, color: "#ec4899" }
  ]
};