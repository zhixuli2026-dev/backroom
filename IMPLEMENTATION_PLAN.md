# 后室游戏 MVP 实施计划

## 概述
创建一个基于 Three.js 的 3D 后室游戏，包含第一人称探索、收集物品、怪物追逐等核心玩法。

## 技术栈
- **前端框架**: Vite + TypeScript
- **3D引擎**: Three.js
- **物理引擎**: 简化的碰撞检测（初期不使用完整物理引擎）
- **状态管理**: 简单的类结构
- **音频**: Web Audio API

## 前置条件
- [ ] Node.js 已安装（推荐 v18+）
- [ ] 了解 TypeScript 基础语法
- [ ] 了解 Three.js 基本概念

---

## Phase 1: 项目基础搭建（第1-2天）

### Step 1.1: 初始化项目结构
**Action**: 使用 Vite 创建 TypeScript 项目，配置 Three.js
**Files**: 
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `index.html`
- `src/main.ts`

**Success**: 
- `npm run dev` 启动成功
- 浏览器显示空白页面（无报错）

**Verification**:
```bash
npm run dev
# 访问 http://localhost:5173，控制台无错误
```

**Estimated Time**: 30 分钟

---

### Step 1.2: 创建基础项目目录结构
**Action**: 建立代码组织结构
**Files**:
```
src/
├── main.ts              # 入口文件
├── core/                # 核心系统
│   ├── Game.ts          # 游戏主类
│   ├── SceneManager.ts  # 场景管理
│   └── InputManager.ts  # 输入管理
├── entities/            # 游戏实体
│   ├── Player.ts        # 玩家
│   └── Entity.ts        # 实体基类
├── world/               # 世界/地图
│   ├── Room.ts          # 房间类
│   └── MapGenerator.ts  # 地图生成
├── ui/                  # UI组件
│   └── HUD.ts           # 抬头显示
├── utils/               # 工具函数
│   └── Math.ts          # 数学工具
└── config/              # 配置
    └── constants.ts     # 常量定义
```

**Success**: 所有目录和空文件创建完成

**Estimated Time**: 15 分钟

---

### Step 1.3: 配置 Three.js 基础场景
**Action**: 创建基础的 3D 渲染场景（相机、渲染器、光照）
**Files**: 
- `src/core/Game.ts`
- `src/core/SceneManager.ts`
- `src/main.ts`

**Success**: 
- 浏览器显示黑色背景
- 控制台输出 "Game initialized"
- 可以看到基础的 Three.js 场景

**Verification**:
```typescript
// 场景应包含：
// - PerspectiveCamera
// - WebGLRenderer
// - Scene with ambient light
// - Animation loop running
```

**Estimated Time**: 45 分钟

---

## Phase 2: 第一人称控制器（第3-4天）

### Step 2.1: 实现基础玩家移动
**Action**: 创建 Player 类，实现 WASD 移动
**Files**: 
- `src/entities/Player.ts`
- `src/core/InputManager.ts`

**Success**: 
- 按 WASD 键，相机在 XZ 平面移动
- 移动速度合理（约 5 units/sec）
- 控制台输出玩家位置

**Verification**:
```typescript
// 测试代码：
player.position.z += 10; // 应该向前移动
console.log(player.position); // 观察坐标变化
```

**Estimated Time**: 1.5 小时

---

### Step 2.2: 添加鼠标视角控制
**Action**: 实现鼠标移动控制视角（FPS 风格）
**Files**: 
- `src/entities/Player.ts`
- `src/core/InputManager.ts`

**Success**: 
- 移动鼠标，视角随之旋转
- 垂直视角限制在 -89° 到 89°
- 支持指针锁定（Pointer Lock API）

**Verification**:
- 点击页面，鼠标被锁定
- 左右移动改变水平视角
- 上下移动改变垂直视角

**Estimated Time**: 1 小时

---

### Step 2.3: 添加碰撞检测
**Action**: 实现简单的 AABB 碰撞检测
**Files**: 
- `src/utils/Collision.ts`
- `src/entities/Player.ts`

**Success**: 
- 玩家不能穿过墙壁
- 在墙角滑动而非卡住
- 性能良好（60 FPS）

**Verification**:
```typescript
// 创建测试墙壁
const wall = new BoxGeometry(10, 5, 1);
// 尝试穿过墙壁，应该被阻挡
```

**Estimated Time**: 2 小时

---

## Phase 3: 后室场景构建（第5-7天）

### Step 3.1: 创建房间模块
**Action**: 实现单个后室房间的生成（黄色墙壁、地毯、荧光灯）
**Files**: 
- `src/world/Room.ts`
- `src/config/constants.ts`

**Success**: 
- 显示一个 10x10 米的房间
- 黄色墙壁材质（#E8E5B5）
- 棕色地毯纹理
- 天花板有荧光灯模型

**Verification**:
- 视觉上符合后室美学
- 光照效果正确
- 纹理正常显示

**Estimated Time**: 3 小时

---

### Step 3.2: 创建简单的固定地图
**Action**: 手动拼接 5-6 个房间形成迷宫
**Files**: 
- `src/world/MapGenerator.ts` (暂时是固定布局)

**Success**: 
- 玩家可以在房间间移动
- 门/通道连接正确
- 没有缝隙或穿模

**Verification**:
- 走遍所有房间
- 确认碰撞正常
- 没有视觉错误

**Estimated Time**: 2 小时

---

### Step 3.3: 添加环境氛围
**Action**: 实现昏暗光照、后处理效果（可选）
**Files**: 
- `src/core/SceneManager.ts`

**Success**: 
- 荧光灯发出昏黄的光
- 整体环境压抑、昏暗
- 可见度适中（不太亮也不太暗）

**Verification**:
- 截图对比后室参考图
- 确认氛围正确

**Estimated Time**: 1.5 小时

---

## Phase 4: 游戏机制（第8-10天）

### Step 4.1: 实现收集物品系统
**Action**: 创建可收集的"出口碎片"对象
**Files**: 
- `src/entities/Collectible.ts`
- `src/core/Game.ts`

**Success**: 
- 地图上生成 1 个发光物体
- 靠近时按 E 键收集
- 收集后物体消失，UI 显示数量

**Verification**:
```typescript
// 收集物品后：
console.log(game.collectedItems); // 应该 = 1
// UI 显示 "碎片: 1/1"
```

**Estimated Time**: 2 小时

---

### Step 4.2: 创建出口门
**Action**: 实现出口门，收集所有碎片后可通过
**Files**: 
- `src/entities/ExitDoor.ts`
- `src/core/Game.ts`

**Success**: 
- 地图中有明显的出口门
- 碎片未收集完时无法通过（提示："需要收集所有碎片"）
- 收集完毕后通过即胜利

**Verification**:
- 不收集直接走到门前 → 提示阻挡
- 收集后走到门前 → 显示胜利界面

**Estimated Time**: 1.5 小时

---

### Step 4.3: 添加基础 UI
**Action**: 创建 HUD（血量、任务提示、收集数量）
**Files**: 
- `src/ui/HUD.ts`
- `index.html` (添加 UI 容器)
- `styles.css` (UI 样式)

**Success**: 
- 左上角显示任务："收集碎片 0/1"
- 屏幕中央显示交互提示："按 E 收集"
- 胜利时显示："逃脱成功！"

**Verification**:
- 打开游戏，UI 正确显示
- 交互时提示更新
- 胜利后显示结束界面

**Estimated Time**: 2 小时

---

## Phase 5: 怪物 AI（第11-14天）

### Step 5.1: 创建怪物实体
**Action**: 实现基础怪物模型和移动
**Files**: 
- `src/entities/Monster.ts`
- `src/entities/Entity.ts` (基类)

**Success**: 
- 场景中出现简单的怪物模型（立方体或简单几何体）
- 怪物可以移动
- 怪物有基础属性（速度、视野范围）

**Verification**:
```typescript
monster.position.x += 1; // 怪物应该移动
monster.lookAt(player.position); // 怪物应该面向玩家
```

**Estimated Time**: 2 小时

---

### Step 5.2: 实现巡逻 AI
**Action**: 怪物沿预设路径巡逻
**Files**: 
- `src/entities/Monster.ts`
- `src/ai/PatrolBehavior.ts`

**Success**: 
- 怪物在多个路径点间循环移动
- 到达路径点后转向下一个
- 移动流畅自然

**Verification**:
- 观察怪物移动 1 分钟
- 确认路径循环正确
- 转向平滑

**Estimated Time**: 3 小时

---

### Step 5.3: 实现追逐逻辑
**Action**: 怪物检测到玩家后追逐
**Files**: 
- `src/entities/Monster.ts`
- `src/ai/ChaseBehavior.ts`

**Success**: 
- 玩家进入怪物视野（10 米）→ 怪物追逐
- 玩家逃出视野 30 秒 → 怪物返回巡逻
- 怪物追上玩家 → 游戏结束

**Verification**:
- 测试场景：
  1. 远离怪物 → 怪物巡逻
  2. 靠近怪物 → 开始追逐
  3. 逃跑并躲藏 → 怪物搜索后返回
  4. 被追上 → 显示失败界面

**Estimated Time**: 4 小时

---

### Step 5.4: 添加怪物音效
**Action**: 怪物移动和追逐时播放音效
**Files**: 
- `src/audio/AudioManager.ts`
- `src/entities/Monster.ts`

**Success**: 
- 怪物接近时听到脚步声
- 被发现时播放警报音
- 音量随距离衰减

**Verification**:
- 戴上耳机测试
- 确认 3D 音频定位正确

**Estimated Time**: 2 小时

---

## Phase 6: 完善与测试（第15-17天）

### Step 6.1: 添加游戏状态管理
**Action**: 实现开始菜单、暂停、胜利/失败界面
**Files**: 
- `src/core/GameState.ts`
- `src/ui/Menu.ts`

**Success**: 
- 打开游戏显示主菜单
- ESC 暂停游戏
- 胜利/失败后显示结果和重新开始按钮

**Estimated Time**: 3 小时

---

### Step 6.2: 性能优化
**Action**: 优化渲染性能，确保 60 FPS
**Files**: 
- `src/core/SceneManager.ts`
- 各实体文件

**Success**: 
- 在低端设备保持 60 FPS
- 无明显卡顿
- 内存使用稳定

**Verification**:
```javascript
// Chrome DevTools:
// Performance tab → 录制 30 秒游戏
// 确认 FPS 稳定在 60
```

**Estimated Time**: 3 小时

---

### Step 6.3: 完整游戏流程测试
**Action**: 从头到尾玩一遍，记录 bug
**Files**: `BUGS.md` (记录问题)

**Success**: 
- 能完整通关
- 所有交互正常
- UI 显示正确
- 音效播放正常

**Verification**:
- [ ] 开始游戏
- [ ] 探索地图
- [ ] 收集碎片
- [ ] 躲避怪物
- [ ] 找到出口
- [ ] 通关成功

**Estimated Time**: 2 小时

---

### Step 6.4: Bug 修复
**Action**: 修复测试中发现的问题
**Files**: 各相关文件

**Success**: 所有已知 bug 已修复

**Estimated Time**: 4 小时

---

## Phase 7: 嵌入集成（第18天）

### Step 7.1: 打包构建
**Action**: 使用 Vite 构建生产版本
**Files**: `dist/` 输出目录

**Success**: 
- `npm run build` 成功
- 生成优化后的静态文件
- 文件大小合理（< 5MB）

**Verification**:
```bash
npm run build
npm run preview
# 测试构建后的版本
```

**Estimated Time**: 30 分钟

---

### Step 7.2: 创建嵌入接口
**Action**: 导出游戏初始化和销毁方法，供 AI 产品调用
**Files**: 
- `src/api.ts`
- `README.md` (集成文档)

**Success**: 
- 提供 `initGame(container: HTMLElement)` 方法
- 提供 `destroyGame()` 方法
- 提供游戏事件回调（胜利、失败）

**Verification**:
```typescript
// 测试代码：
const container = document.getElementById('game');
initGame(container);
// 游戏应该在容器中启动
```

**Estimated Time**: 1 小时

---

## 验收标准

### 功能性
- [ ] 玩家可以自由移动和环视
- [ ] 可以收集物品
- [ ] 怪物会巡逻和追逐
- [ ] 被抓住后游戏失败
- [ ] 收集所有碎片并到达出口后胜利
- [ ] UI 正确显示游戏状态

### 性能
- [ ] 稳定 60 FPS
- [ ] 加载时间 < 3 秒
- [ ] 内存使用 < 200MB

### 美术
- [ ] 后室氛围还原度高
- [ ] 光照和材质符合设定
- [ ] UI 简洁清晰

### 音效
- [ ] 环境音效播放正常
- [ ] 怪物音效有空间感
- [ ] 音量平衡合理

---

## 风险与备选方案

### 风险1: Three.js 学习曲线
**缓解**: 先完成官方教程，使用简单几何体原型

### 风险2: 怪物 AI 复杂度
**备选**: 简化为只有追逐，无巡逻

### 风险3: 性能问题
**备选**: 减少场景复杂度，降低模型精度

### 风险4: 程序化生成困难
**MVP方案**: 使用固定地图，后期再迭代

---

## 时间估算总结

| Phase | 预计时间 | 内容 |
|-------|---------|------|
| Phase 1 | 2 天 | 项目搭建 |
| Phase 2 | 2 天 | 第一人称控制 |
| Phase 3 | 3 天 | 后室场景 |
| Phase 4 | 3 天 | 游戏机制 |
| Phase 5 | 4 天 | 怪物 AI |
| Phase 6 | 3 天 | 完善测试 |
| Phase 7 | 1 天 | 打包集成 |
| **总计** | **18 天** | |

---

## 立即开始

从 **Step 1.1** 开始执行。每完成一个 Step，标记为已完成并提交代码。

**第一步**: 初始化 Vite + TypeScript 项目
