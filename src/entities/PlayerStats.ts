import * as THREE from 'three';

/**
 * 玩家状态管理类
 */
export class PlayerStats {
  // 生命值系统
  public maxHealth: number = 4;
  public currentHealth: number = 4;

  // 体力系统
  public maxStamina: number = 100;
  public currentStamina: number = 100;
  public staminaDrainRate: number = 10; // 奔跑时每秒消耗
  public staminaRegenRate: number = 5; // 站立时每秒恢复
  public staminaRegenRateWalking: number = 2; // 行走时每秒恢复

  // 受伤状态
  public isInjured: boolean = false;
  public injuredTimer: number = 0;
  public injuredDuration: number = 3; // 受伤状态持续3秒
  public injuredSpeedMultiplier: number = 0.5; // 受伤时速度减半

  // 无敌时间（被击中后短暂无敌）
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;
  public invulnerableDuration: number = 1.5; // 1.5秒无敌时间

  /**
   * 更新状态
   */
  public update(deltaTime: number, isRunning: boolean, isMoving: boolean): void {
    // 更新体力
    this.updateStamina(deltaTime, isRunning, isMoving);

    // 更新受伤状态
    this.updateInjured(deltaTime);

    // 更新无敌状态
    this.updateInvulnerable(deltaTime);
  }

  /**
   * 更新体力
   */
  private updateStamina(deltaTime: number, isRunning: boolean, isMoving: boolean): void {
    if (isRunning && isMoving && this.currentStamina > 0) {
      // 奔跑消耗体力
      this.currentStamina -= this.staminaDrainRate * deltaTime;
      this.currentStamina = Math.max(0, this.currentStamina);
    } else {
      // 恢复体力
      const regenRate = isMoving ? this.staminaRegenRateWalking : this.staminaRegenRate;
      this.currentStamina += regenRate * deltaTime;
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina);
    }
  }

  /**
   * 更新受伤状态
   */
  private updateInjured(deltaTime: number): void {
    if (this.isInjured) {
      this.injuredTimer -= deltaTime;
      if (this.injuredTimer <= 0) {
        this.isInjured = false;
        console.log('Recovered from injury');
      }
    }
  }

  /**
   * 更新无敌状态
   */
  private updateInvulnerable(deltaTime: number): void {
    if (this.isInvulnerable) {
      this.invulnerableTimer -= deltaTime;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }

  /**
   * 受到伤害
   */
  public takeDamage(amount: number = 1): boolean {
    if (this.isInvulnerable) {
      return false; // 无敌期间不受伤
    }

    this.currentHealth -= amount;
    this.currentHealth = Math.max(0, this.currentHealth);

    // 进入受伤状态
    this.isInjured = true;
    this.injuredTimer = this.injuredDuration;

    // 进入无敌状态
    this.isInvulnerable = true;
    this.invulnerableTimer = this.invulnerableDuration;

    console.log(`Player took ${amount} damage. Health: ${this.currentHealth}/${this.maxHealth}`);

    return true;
  }

  /**
   * 治疗
   */
  public heal(amount: number = 1): void {
    this.currentHealth += amount;
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth);
    console.log(`Player healed ${amount}. Health: ${this.currentHealth}/${this.maxHealth}`);
  }

  /**
   * 恢复体力
   */
  public restoreStamina(amount: number): void {
    this.currentStamina += amount;
    this.currentStamina = Math.min(this.maxStamina, this.currentStamina);
    console.log(`Stamina restored by ${amount}`);
  }

  /**
   * 检查是否可以奔跑
   */
  public canRun(): boolean {
    return this.currentStamina > 5; // 至少需要5点体力才能奔跑
  }

  /**
   * 检查是否存活
   */
  public isAlive(): boolean {
    return this.currentHealth > 0;
  }

  /**
   * 获取速度倍数（考虑受伤状态）
   */
  public getSpeedMultiplier(): number {
    return this.isInjured ? this.injuredSpeedMultiplier : 1.0;
  }

  /**
   * 获取生命值百分比
   */
  public getHealthPercentage(): number {
    return this.currentHealth / this.maxHealth;
  }

  /**
   * 获取体力百分比
   */
  public getStaminaPercentage(): number {
    return this.currentStamina / this.maxStamina;
  }

  /**
   * 重置状态（重新开始游戏时）
   */
  public reset(): void {
    this.currentHealth = this.maxHealth;
    this.currentStamina = this.maxStamina;
    this.isInjured = false;
    this.injuredTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
  }
}
