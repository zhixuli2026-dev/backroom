import * as THREE from 'three';

/**
 * 技能类型枚举
 */
export enum SkillType {
  DODGE = 'dodge',           // 闪避翻滚
  SPRINT_BURST = 'sprint_burst', // 冲刺爆发
  STEALTH = 'stealth',       // 隐身模式
  QUICK_TURN = 'quick_turn', // 快速转身
  ADRENALINE = 'adrenaline', // 肾上腺素激增
}

/**
 * 技能配置接口
 */
interface SkillConfig {
  type: SkillType;
  name: string;
  description: string;
  cooldown: number;     // 冷却时间（秒）
  duration: number;     // 持续时间（秒）
  staminaCost: number;  // 体力消耗
  keybind: string;      // 按键绑定
}

/**
 * 技能配置表
 */
export const SKILL_CONFIGS: Record<SkillType, SkillConfig> = {
  [SkillType.DODGE]: {
    type: SkillType.DODGE,
    name: '闪避翻滚',
    description: '快速向前翻滚，短暂无敌',
    cooldown: 3,
    duration: 0.5,
    staminaCost: 20,
    keybind: 'Space',
  },
  [SkillType.SPRINT_BURST]: {
    type: SkillType.SPRINT_BURST,
    name: '冲刺爆发',
    description: '3秒内移动速度提升50%',
    cooldown: 8,
    duration: 3,
    staminaCost: 30,
    keybind: 'KeyQ',
  },
  [SkillType.STEALTH]: {
    type: SkillType.STEALTH,
    name: '隐身模式',
    description: '5秒内怪物检测范围减半',
    cooldown: 15,
    duration: 5,
    staminaCost: 40,
    keybind: 'KeyV',
  },
  [SkillType.QUICK_TURN]: {
    type: SkillType.QUICK_TURN,
    name: '快速转身',
    description: '瞬间转身180度',
    cooldown: 5,
    duration: 0.1,
    staminaCost: 10,
    keybind: 'KeyR',
  },
  [SkillType.ADRENALINE]: {
    type: SkillType.ADRENALINE,
    name: '肾上腺素激增',
    description: '10秒内体力不消耗',
    cooldown: 20,
    duration: 10,
    staminaCost: 0,
    keybind: 'KeyX',
  },
};

/**
 * 技能状态
 */
interface SkillState {
  config: SkillConfig;
  cooldownTimer: number;  // 冷却计时器
  durationTimer: number;  // 持续计时器
  isActive: boolean;      // 是否激活中
  isOnCooldown: boolean;  // 是否冷却中
}

/**
 * 玩家技能系统
 */
export class PlayerSkills {
  private skills: Map<SkillType, SkillState> = new Map();

  // 技能效果状态
  public isDodging: boolean = false;
  public isSprintBoosted: boolean = false;
  public isStealthed: boolean = false;
  public isAdrenalineActive: boolean = false;

  constructor() {
    // 初始化所有技能
    Object.values(SKILL_CONFIGS).forEach(config => {
      this.skills.set(config.type, {
        config,
        cooldownTimer: 0,
        durationTimer: 0,
        isActive: false,
        isOnCooldown: false,
      });
    });
  }

  /**
   * 更新技能系统
   */
  public update(deltaTime: number): void {
    this.skills.forEach((state, type) => {
      // 更新冷却计时器
      if (state.isOnCooldown) {
        state.cooldownTimer -= deltaTime;
        if (state.cooldownTimer <= 0) {
          state.isOnCooldown = false;
          state.cooldownTimer = 0;
          console.log(`${state.config.name} ready!`);
        }
      }

      // 更新持续时间计时器
      if (state.isActive) {
        state.durationTimer -= deltaTime;
        if (state.durationTimer <= 0) {
          this.deactivateSkill(type);
        }
      }
    });
  }

  /**
   * 尝试使用技能
   */
  public tryUseSkill(skillType: SkillType, currentStamina: number): {
    success: boolean;
    staminaCost: number;
  } {
    const state = this.skills.get(skillType);
    if (!state) {
      return { success: false, staminaCost: 0 };
    }

    // 检查是否在冷却中
    if (state.isOnCooldown) {
      console.log(`${state.config.name} is on cooldown (${state.cooldownTimer.toFixed(1)}s)`);
      return { success: false, staminaCost: 0 };
    }

    // 检查是否已经激活
    if (state.isActive) {
      return { success: false, staminaCost: 0 };
    }

    // 检查体力是否足够
    if (currentStamina < state.config.staminaCost) {
      console.log(`Not enough stamina for ${state.config.name}`);
      return { success: false, staminaCost: 0 };
    }

    // 激活技能
    this.activateSkill(skillType);

    return {
      success: true,
      staminaCost: state.config.staminaCost,
    };
  }

  /**
   * 激活技能
   */
  private activateSkill(skillType: SkillType): void {
    const state = this.skills.get(skillType);
    if (!state) return;

    state.isActive = true;
    state.durationTimer = state.config.duration;
    state.isOnCooldown = true;
    state.cooldownTimer = state.config.cooldown;

    // 设置技能效果状态
    switch (skillType) {
      case SkillType.DODGE:
        this.isDodging = true;
        break;
      case SkillType.SPRINT_BURST:
        this.isSprintBoosted = true;
        break;
      case SkillType.STEALTH:
        this.isStealthed = true;
        break;
      case SkillType.ADRENALINE:
        this.isAdrenalineActive = true;
        break;
    }

    console.log(`Activated ${state.config.name}!`);
  }

  /**
   * 停用技能
   */
  private deactivateSkill(skillType: SkillType): void {
    const state = this.skills.get(skillType);
    if (!state) return;

    state.isActive = false;
    state.durationTimer = 0;

    // 清除技能效果状态
    switch (skillType) {
      case SkillType.DODGE:
        this.isDodging = false;
        break;
      case SkillType.SPRINT_BURST:
        this.isSprintBoosted = false;
        break;
      case SkillType.STEALTH:
        this.isStealthed = false;
        break;
      case SkillType.ADRENALINE:
        this.isAdrenalineActive = false;
        break;
    }

    console.log(`${state.config.name} ended`);
  }

  /**
   * 执行闪避翻滚（需要外部调用来处理移动）
   */
  public getDodgeDirection(camera: THREE.Camera): THREE.Vector3 | null {
    if (!this.isDodging) return null;

    // 向前翻滚
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.setY(0).normalize();
    direction.multiplyScalar(8); // 翻滚速度

    return direction;
  }

  /**
   * 执行快速转身
   */
  public performQuickTurn(camera: THREE.Camera): boolean {
    const state = this.skills.get(SkillType.QUICK_TURN);
    if (!state) return false;

    if (state.isOnCooldown) {
      return false;
    }

    // 转身180度
    camera.rotation.y += Math.PI;

    // 进入冷却
    state.isOnCooldown = true;
    state.cooldownTimer = state.config.cooldown;

    console.log('Quick turn!');
    return true;
  }

  /**
   * 获取速度倍数
   */
  public getSpeedMultiplier(): number {
    if (this.isSprintBoosted) {
      return 1.5; // 冲刺爆发提升50%
    }
    if (this.isDodging) {
      return 2.0; // 翻滚时速度翻倍
    }
    return 1.0;
  }

  /**
   * 获取隐身系数（影响怪物检测范围）
   */
  public getStealthMultiplier(): number {
    return this.isStealthed ? 0.5 : 1.0;
  }

  /**
   * 检查是否在闪避无敌状态
   */
  public isInvulnerableFromDodge(): boolean {
    return this.isDodging;
  }

  /**
   * 检查体力是否应该消耗（肾上腺素激增时不消耗）
   */
  public shouldDrainStamina(): boolean {
    return !this.isAdrenalineActive;
  }

  /**
   * 获取技能状态
   */
  public getSkillState(skillType: SkillType): SkillState | undefined {
    return this.skills.get(skillType);
  }

  /**
   * 获取所有技能状态
   */
  public getAllSkillStates(): SkillState[] {
    return Array.from(this.skills.values());
  }

  /**
   * 重置所有技能
   */
  public reset(): void {
    this.skills.forEach(state => {
      state.cooldownTimer = 0;
      state.durationTimer = 0;
      state.isActive = false;
      state.isOnCooldown = false;
    });

    this.isDodging = false;
    this.isSprintBoosted = false;
    this.isStealthed = false;
    this.isAdrenalineActive = false;
  }
}
