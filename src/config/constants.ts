// 游戏配置常量

export const GAME_CONFIG = {
  // 渲染器配置
  RENDERER: {
    ANTIALIAS: true,
    SHADOW_MAP_ENABLED: true,
  },

  // 玩家配置
  PLAYER: {
    HEIGHT: 1.7, // 玩家高度（米）
    WALK_SPEED: 5, // 行走速度
    RUN_SPEED: 8, // 奔跑速度
    CROUCH_SPEED: 2.5, // 蹲下速度
    LOOK_SENSITIVITY: 0.002, // 鼠标灵敏度
    MAX_PITCH: Math.PI / 2 - 0.1, // 最大俯仰角
  },

  // 房间配置
  ROOM: {
    WIDTH: 10, // 房间宽度
    HEIGHT: 3, // 房间高度
    DEPTH: 10, // 房间深度
    WALL_THICKNESS: 0.2, // 墙壁厚度
  },

  // 颜色配置（后室风格）
  COLORS: {
    WALL: 0xe8e5b5, // 泛黄的墙壁
    FLOOR: 0x8b7355, // 棕色地毯
    CEILING: 0xf5f5dc, // 米色天花板
    LIGHT: 0xffebb3, // 昏黄的荧光灯
  },

  // 怪物配置
  MONSTER: {
    PATROL_SPEED: 2, // 巡逻速度
    CHASE_SPEED: 6, // 追逐速度
    DETECTION_RANGE: 10, // 检测范围（米）
    LOSE_INTEREST_TIME: 30, // 失去兴趣时间（秒）
  },

  // 游戏机制
  MECHANICS: {
    COLLECTIBLE_COUNT: 4, // 可收集物品数量
    INTERACTION_DISTANCE: 2, // 交互距离（米）
  },
};

export const KEYS = {
  FORWARD: 'KeyW',
  BACKWARD: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  RUN: 'ShiftLeft',
  INTERACT: 'KeyE',
  PAUSE: 'Escape',
};
