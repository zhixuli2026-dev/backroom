import * as THREE from 'three';
import { Entity } from './Entity';
import { GAME_CONFIG, KEYS } from '../config/constants';
import { InputManager } from '../core/InputManager';
import { Collider } from '../utils/Collision';
import { PlayerStats } from './PlayerStats';
import { Flashlight, FlashlightMode } from './Flashlight';
import { PlayerSkills, SkillType } from './PlayerSkills';
import { Inventory } from '../utils/Inventory';
import { ItemType, ITEM_CONFIGS } from './Item';

/**
 * 玩家类 - 第一人称控制器
 */
export class Player extends Entity {
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private moveSpeed: number = GAME_CONFIG.PLAYER.WALK_SPEED;

  // 视角控制
  private pitch: number = 0; // 俯仰角
  private yaw: number = 0;   // 偏航角

  // 碰撞体
  public collider: Collider;

  // 玩家系统
  public stats: PlayerStats;
  public flashlight: Flashlight;
  public skills: PlayerSkills;
  public inventory: Inventory;

  // 击退效果
  private knockbackVelocity: THREE.Vector3 = new THREE.Vector3();
  private knockbackDecay: number = 10; // 击退衰减速度

  constructor(camera: THREE.PerspectiveCamera, inputManager: InputManager, scene: THREE.Scene) {
    // 创建一个空的 Object3D 作为玩家容器
    const playerContainer = new THREE.Object3D();
    super(playerContainer);

    this.camera = camera;
    this.inputManager = inputManager;

    // 将相机添加到玩家容器中
    this.mesh.add(this.camera);
    this.camera.position.set(0, GAME_CONFIG.PLAYER.HEIGHT, 0);

    // 设置初始位置
    this.position.set(0, 0, 5);

    // 创建碰撞体（圆柱形碰撞体，半径0.5米）
    this.collider = new Collider(
      this.position.clone(),
      new THREE.Vector3(0.8, GAME_CONFIG.PLAYER.HEIGHT, 0.8)
    );

    // 初始化玩家系统
    this.stats = new PlayerStats();
    this.flashlight = new Flashlight(scene, camera);
    this.skills = new PlayerSkills();
    this.inventory = new Inventory();

    console.log('Player initialized');
  }

  /**
   * 更新玩家逻辑
   */
  public update(deltaTime: number): void {
    // 检查玩家是否存活
    if (!this.stats.isAlive()) {
      return;
    }

    // 处理输入（在计算移动方向之前）
    this.handleInput(deltaTime);

    // 更新玩家系统
    const isMoving = this.direction.length() > 0;
    const isRunning = this.inputManager.isKeyPressed(KEYS.RUN) && this.stats.canRun();
    this.stats.update(deltaTime, isRunning, isMoving);
    this.flashlight.update(deltaTime);
    this.skills.update(deltaTime);

    // 更新移动
    this.updateMovement(deltaTime, isRunning);
    this.updateRotation();

    // 更新击退
    this.updateKnockback(deltaTime);

    // 更新碰撞体位置
    this.collider.position.copy(this.position);
    this.collider.updateBoundingBox();
  }

  /**
   * 处理输入
   */
  private handleInput(deltaTime: number): void {
    // 手电筒切换 (F键)
    if (this.inputManager.isKeyJustPressed('KeyF')) {
      this.flashlight.toggleMode();
    }

    // 手电筒爆闪 (B键)
    if (this.inputManager.isKeyJustPressed('KeyB')) {
      this.flashlight.useBurst();
    }

    // 技能使用
    if (this.inputManager.isKeyJustPressed('Space')) {
      const result = this.skills.tryUseSkill(SkillType.DODGE, this.stats.currentStamina);
      if (result.success) {
        this.stats.currentStamina -= result.staminaCost;
      }
    }

    if (this.inputManager.isKeyJustPressed('KeyQ')) {
      const result = this.skills.tryUseSkill(SkillType.SPRINT_BURST, this.stats.currentStamina);
      if (result.success) {
        this.stats.currentStamina -= result.staminaCost;
      }
    }

    if (this.inputManager.isKeyJustPressed('KeyV')) {
      const result = this.skills.tryUseSkill(SkillType.STEALTH, this.stats.currentStamina);
      if (result.success) {
        this.stats.currentStamina -= result.staminaCost;
      }
    }

    if (this.inputManager.isKeyJustPressed('KeyR')) {
      const result = this.skills.tryUseSkill(SkillType.QUICK_TURN, this.stats.currentStamina);
      if (result.success) {
        this.stats.currentStamina -= result.staminaCost;
        this.skills.performQuickTurn(this.camera);
      }
    }

    if (this.inputManager.isKeyJustPressed('KeyX')) {
      const result = this.skills.tryUseSkill(SkillType.ADRENALINE, this.stats.currentStamina);
      if (result.success) {
        this.stats.currentStamina -= result.staminaCost;
      }
    }

    // 物品使用 (1-6数字键)
    for (let i = 0; i < 6; i++) {
      if (this.inputManager.isKeyJustPressed(`Digit${i + 1}`)) {
        this.useInventoryItem(i);
      }
    }
  }

  /**
   * 更新移动
   */
  private updateMovement(deltaTime: number, isRunning: boolean): void {
    // 重置方向
    this.direction.set(0, 0, 0);

    // 检测按键输入
    const forward = this.inputManager.isKeyPressed(KEYS.FORWARD);
    const backward = this.inputManager.isKeyPressed(KEYS.BACKWARD);
    const left = this.inputManager.isKeyPressed(KEYS.LEFT);
    const right = this.inputManager.isKeyPressed(KEYS.RIGHT);

    // 计算移动方向（相对于玩家朝向）
    if (forward) this.direction.z -= 1;
    if (backward) this.direction.z += 1;
    if (left) this.direction.x -= 1;
    if (right) this.direction.x += 1;

    // 归一化方向向量（防止斜向移动过快）
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // 确定移动速度
    let baseSpeed = isRunning ? GAME_CONFIG.PLAYER.RUN_SPEED : GAME_CONFIG.PLAYER.WALK_SPEED;

    // 应用速度修正
    baseSpeed *= this.stats.getSpeedMultiplier(); // 受伤减速
    baseSpeed *= this.skills.getSpeedMultiplier(); // 技能加速

    this.moveSpeed = baseSpeed;

    // 处理闪避翻滚
    const dodgeDirection = this.skills.getDodgeDirection(this.camera);
    if (dodgeDirection) {
      this.velocity.x = dodgeDirection.x;
      this.velocity.z = dodgeDirection.z;
    } else {
      // 正常移动
      const moveDirection = this.direction.clone();
      moveDirection.applyQuaternion(this.mesh.quaternion);

      this.velocity.x = moveDirection.x * this.moveSpeed;
      this.velocity.z = moveDirection.z * this.moveSpeed;
    }

    // 应用移动
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
  }

  /**
   * 更新视角旋转
   */
  private updateRotation(): void {
    if (!this.inputManager.isPointerLockedState()) return;

    const mouseMovement = this.inputManager.getMouseMovement();

    // 更新偏航角（左右旋转）
    this.yaw -= mouseMovement.x * GAME_CONFIG.PLAYER.LOOK_SENSITIVITY;

    // 更新俯仰角（上下旋转），限制在 [-89°, 89°]
    this.pitch -= mouseMovement.y * GAME_CONFIG.PLAYER.LOOK_SENSITIVITY;
    this.pitch = Math.max(-GAME_CONFIG.PLAYER.MAX_PITCH, Math.min(GAME_CONFIG.PLAYER.MAX_PITCH, this.pitch));

    // 应用旋转
    this.mesh.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /**
   * 解决碰撞（将玩家推出碰撞区域）
   */
  public resolveCollision(other: Collider): void {
    const penetration = this.collider.getPenetration(other);
    if (penetration) {
      // 将玩家沿穿透方向推出
      this.position.x += penetration.direction.x * penetration.depth;
      this.position.z += penetration.direction.z * penetration.depth;

      // 更新碰撞体位置
      this.collider.position.copy(this.position);
      this.collider.updateBoundingBox();
    }
  }

  /**
   * 获取相机
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 获取前方向量（用于射线检测等）
   */
  public getForwardVector(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    return direction;
  }

  /**
   * 受到伤害
   */
  public takeDamage(amount: number = 1): boolean {
    // 检查闪避无敌
    if (this.skills.isInvulnerableFromDodge()) {
      console.log('Dodged attack!');
      return false;
    }

    return this.stats.takeDamage(amount);
  }

  /**
   * 应用击退效果
   */
  public applyKnockback(direction: THREE.Vector3, force: number = 5): void {
    this.knockbackVelocity.copy(direction);
    this.knockbackVelocity.multiplyScalar(force);
  }

  /**
   * 更新击退效果
   */
  private updateKnockback(deltaTime: number): void {
    if (this.knockbackVelocity.length() > 0.1) {
      // 应用击退移动
      this.position.x += this.knockbackVelocity.x * deltaTime;
      this.position.z += this.knockbackVelocity.z * deltaTime;

      // 衰减击退速度
      this.knockbackVelocity.multiplyScalar(Math.max(0, 1 - this.knockbackDecay * deltaTime));
    } else {
      this.knockbackVelocity.set(0, 0, 0);
    }
  }

  /**
   * 使用背包物品
   */
  private useInventoryItem(slotIndex: number): void {
    const itemType = this.inventory.useItem(slotIndex);
    if (!itemType) return;

    const config = ITEM_CONFIGS[itemType];

    // 执行物品效果
    switch (itemType) {
      case ItemType.BATTERY:
        this.flashlight.recharge(50);
        break;

      case ItemType.ALMOND_WATER:
        this.stats.heal(1);
        break;

      case ItemType.ENERGY_DRINK:
        this.stats.restoreStamina(50);
        break;

      case ItemType.JAMMER:
        // 激活隐身技能（如果未激活）
        this.skills.tryUseSkill(SkillType.STEALTH, 0);
        break;

      case ItemType.KEY_CARD:
        console.log('Key card ready to use on doors');
        break;

      case ItemType.MAP_PIECE:
        console.log('Map piece revealed');
        break;

      case ItemType.DECOY:
        console.log('Decoy thrown (TODO: implement decoy entity)');
        break;

      case ItemType.SMOKE_BOMB:
        console.log('Smoke bomb deployed (TODO: implement smoke effect)');
        break;
    }
  }

  /**
   * 获取隐身系数（用于怪物检测）
   */
  public getStealthMultiplier(): number {
    let multiplier = this.skills.getStealthMultiplier();

    // 手电筒关闭时更隐蔽
    if (!this.flashlight.isOn()) {
      multiplier *= 0.7;
    }

    return multiplier;
  }

  /**
   * 重置玩家状态
   */
  public reset(): void {
    this.stats.reset();
    this.flashlight.reset();
    this.skills.reset();
    this.inventory.clear();
    this.knockbackVelocity.set(0, 0, 0);
  }
}
