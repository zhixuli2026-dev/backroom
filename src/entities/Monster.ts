import * as THREE from 'three';
import { Entity } from './Entity';
import { GAME_CONFIG } from '../config/constants';
import { Collider } from '../utils/Collision';

/**
 * 怪物状态枚举
 */
export enum MonsterState {
  PATROL = 'patrol',
  CHASE = 'chase',
  SEARCH = 'search',
  STUNNED = 'stunned', // 新增：击晕状态
}

/**
 * 怪物类 - 后室中的敌对实体
 */
export class Monster extends Entity {
  public state: MonsterState = MonsterState.PATROL;
  private patrolPoints: THREE.Vector3[] = [];
  private currentPatrolIndex: number = 0;
  private chaseTarget?: THREE.Vector3;
  private searchTimer: number = 0;
  private searchDuration: number = GAME_CONFIG.MONSTER.LOSE_INTEREST_TIME;
  public collider: Collider;

  // 移动相关
  private moveSpeed: number = GAME_CONFIG.MONSTER.PATROL_SPEED;
  private rotationSpeed: number = 3;

  // 攻击冷却
  private attackCooldown: number = 0;
  private attackCooldownDuration: number = 2; // 2秒冷却时间
  private stunnedTimer: number = 0;
  private stunnedDuration: number = 1; // 击晕1秒

  constructor(position: THREE.Vector3, patrolPoints: THREE.Vector3[]) {
    // 创建简单的怪物模型（暂时用黑色的高个子形状）
    const monsterGroup = new THREE.Group();

    // 身体（细长的长方体）
    const bodyGeometry = new THREE.BoxGeometry(0.6, 2.5, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    monsterGroup.add(body);

    // 头部（稍小的立方体）
    const headGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2.8;
    head.castShadow = true;
    monsterGroup.add(head);

    // 眼睛（红色发光）
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 2.85, 0.25);
    monsterGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 2.85, 0.25);
    monsterGroup.add(rightEye);

    // 添加点光源（红色，营造恐怖氛围）
    const light = new THREE.PointLight(0xff0000, 0.5, 5);
    light.position.set(0, 2.5, 0);
    monsterGroup.add(light);

    monsterGroup.position.copy(position);
    super(monsterGroup);

    this.patrolPoints = patrolPoints;

    // 创建碰撞体
    this.collider = new Collider(
      this.position.clone(),
      new THREE.Vector3(0.8, 2.5, 0.8)
    );
  }

  /**
   * 更新怪物逻辑
   */
  public update(deltaTime: number): void {
    // 更新攻击冷却
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // 更新击晕计时器
    if (this.stunnedTimer > 0) {
      this.stunnedTimer -= deltaTime;
      this.state = MonsterState.STUNNED;
    }

    switch (this.state) {
      case MonsterState.PATROL:
        this.updatePatrol(deltaTime);
        break;
      case MonsterState.CHASE:
        this.updateChase(deltaTime);
        break;
      case MonsterState.SEARCH:
        this.updateSearch(deltaTime);
        break;
      case MonsterState.STUNNED:
        this.updateStunned(deltaTime);
        break;
    }

    // 强制保持Y坐标在地面
    this.position.y = 0;

    // 更新碰撞体位置
    this.collider.position.copy(this.position);
    this.collider.updateBoundingBox();

    // 让怪物微微摇晃（增加诡异感）
    const time = Date.now() * 0.001;
    this.mesh.rotation.z = Math.sin(time * 2) * 0.05;
  }

  /**
   * 巡逻状态更新
   */
  private updatePatrol(deltaTime: number): void {
    if (this.patrolPoints.length === 0) return;

    this.moveSpeed = GAME_CONFIG.MONSTER.PATROL_SPEED;

    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    const direction = new THREE.Vector3()
      .subVectors(targetPoint, this.position)
      .setY(0)
      .normalize();

    // 移动到目标点
    const movement = direction.multiplyScalar(this.moveSpeed * deltaTime);
    this.position.add(movement);

    // 旋转朝向目标
    this.rotateTowards(targetPoint, deltaTime);

    // 检查是否到达巡逻点
    const distance = this.position.distanceTo(targetPoint);
    if (distance < 0.5) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    }
  }

  /**
   * 追逐状态更新
   */
  private updateChase(deltaTime: number): void {
    if (!this.chaseTarget) {
      this.state = MonsterState.SEARCH;
      return;
    }

    this.moveSpeed = GAME_CONFIG.MONSTER.CHASE_SPEED;

    const direction = new THREE.Vector3()
      .subVectors(this.chaseTarget, this.position)
      .setY(0)
      .normalize();

    // 移动到目标
    const movement = direction.multiplyScalar(this.moveSpeed * deltaTime);
    this.position.add(movement);

    // 快速旋转朝向目标
    this.rotateTowards(this.chaseTarget, deltaTime * 2);
  }

  /**
   * 搜索状态更新
   */
  private updateSearch(deltaTime: number): void {
    this.searchTimer += deltaTime;

    // 缓慢旋转，搜索玩家
    this.mesh.rotation.y += deltaTime * 0.5;

    // 搜索超时，返回巡逻
    if (this.searchTimer >= this.searchDuration) {
      this.state = MonsterState.PATROL;
      this.searchTimer = 0;
      console.log('Monster lost interest, returning to patrol');
    }
  }

  /**
   * 击晕状态更新
   */
  private updateStunned(deltaTime: number): void {
    // 击晕期间不移动，只是站在原地
    // 可以添加晃动动画
    const time = Date.now() * 0.001;
    this.mesh.rotation.z = Math.sin(time * 10) * 0.2; // 晃动效果

    // 击晕结束后恢复之前的状态
    if (this.stunnedTimer <= 0) {
      this.state = MonsterState.PATROL;
      this.mesh.rotation.z = 0;
    }
  }

  /**
   * 旋转朝向目标
   */
  private rotateTowards(target: THREE.Vector3, deltaTime: number): void {
    const direction = new THREE.Vector3()
      .subVectors(target, this.position)
      .setY(0)
      .normalize();

    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = this.mesh.rotation.y;

    // 平滑旋转
    let angleDiff = targetAngle - currentAngle;

    // 归一化角度差到 [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const rotationStep = this.rotationSpeed * deltaTime;
    if (Math.abs(angleDiff) < rotationStep) {
      this.mesh.rotation.y = targetAngle;
    } else {
      this.mesh.rotation.y += Math.sign(angleDiff) * rotationStep;
    }
  }

  /**
   * 检测玩家
   */
  public detectPlayer(playerPosition: THREE.Vector3): boolean {
    const distance = this.position.distanceTo(playerPosition);

    if (distance < GAME_CONFIG.MONSTER.DETECTION_RANGE) {
      // 发现玩家，进入追逐状态
      this.state = MonsterState.CHASE;
      this.chaseTarget = playerPosition.clone();
      this.searchTimer = 0;
      return true;
    } else if (this.state === MonsterState.CHASE) {
      // 玩家逃出范围，进入搜索状态
      this.state = MonsterState.SEARCH;
      this.chaseTarget = undefined;
    }

    return false;
  }

  /**
   * 尝试攻击玩家
   * @returns 攻击成功返回击退方向，否则返回 null
   */
  public tryAttackPlayer(playerPosition: THREE.Vector3): {
    success: boolean;
    knockbackDirection?: THREE.Vector3
  } {
    const distance = this.position.distanceTo(playerPosition);

    // 检查是否在攻击范围内且冷却完毕
    if (distance < 1.5 && this.attackCooldown <= 0) {
      // 攻击成功
      this.attackCooldown = this.attackCooldownDuration;
      this.stunnedTimer = this.stunnedDuration;

      // 计算击退方向（从怪物到玩家）
      const knockbackDirection = new THREE.Vector3()
        .subVectors(playerPosition, this.position)
        .setY(0)
        .normalize();

      console.log('Monster attacked player!');

      return {
        success: true,
        knockbackDirection
      };
    }

    return { success: false };
  }

  /**
   * 检查是否可以攻击
   */
  public canAttack(): boolean {
    return this.attackCooldown <= 0 && this.state !== MonsterState.STUNNED;
  }

  /**
   * 设置巡逻路径
   */
  public setPatrolPoints(points: THREE.Vector3[]): void {
    this.patrolPoints = points;
    this.currentPatrolIndex = 0;
  }

  /**
   * 解决碰撞（将怪物推出碰撞区域）
   */
  public resolveCollision(other: Collider): void {
    const penetration = this.collider.getPenetration(other);
    if (penetration) {
      // 记录碰撞前的位置
      const beforeX = this.position.x;
      const beforeZ = this.position.z;

      // 将怪物沿穿透方向推出
      this.position.x += penetration.direction.x * penetration.depth;
      this.position.z += penetration.direction.z * penetration.depth;

      // 更新碰撞体位置
      this.collider.position.copy(this.position);
      this.collider.updateBoundingBox();

      // 调试日志
      if (Math.abs(this.position.x - beforeX) > 0.1 || Math.abs(this.position.z - beforeZ) > 0.1) {
        console.log(`[Monster] Collision resolved: (${beforeX.toFixed(1)}, ${beforeZ.toFixed(1)}) -> (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}), depth: ${penetration.depth.toFixed(2)}`);
      }
    }
  }
}
