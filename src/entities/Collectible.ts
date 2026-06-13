import * as THREE from 'three';
import { Entity } from './Entity';
import { GAME_CONFIG } from '../config/constants';

/**
 * 可收集物品类 - 出口碎片
 */
export class Collectible extends Entity {
  private glowIntensity: number = 0;
  private rotationSpeed: number = 1;
  public isCollected: boolean = false;
  private baseY: number; // 保存基准高度
  private collectAnimationTime: number = 0; // 收集动画计时器
  private collectAnimationDuration: number = 0.15; // 收集动画持续时间（秒）- 更快

  constructor(position: THREE.Vector3) {
    // 创建发光的碎片模型
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;

    super(mesh);

    this.baseY = position.y; // 保存初始Y坐标

    // 添加粒子光环效果
    this.addGlowEffect();

    // 添加点光源
    const light = new THREE.PointLight(0x00ffff, 1, 5);
    light.position.copy(position);
    this.mesh.add(light);
  }

  /**
   * 添加发光效果
   */
  private addGlowEffect(): void {
    // 创建外层发光球体
    const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(glowMesh);
  }

  /**
   * 更新逻辑
   */
  public update(deltaTime: number): void {
    if (this.isCollected) {
      // 收集动画：快速缩小
      this.collectAnimationTime += deltaTime;
      const progress = Math.min(this.collectAnimationTime / this.collectAnimationDuration, 1);
      const scale = 1 - progress;

      this.mesh.scale.set(scale, scale, scale);

      if (progress >= 1) {
        this.mesh.visible = false;
      }
      return;
    }

    // 旋转动画
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;

    // 上下浮动动画 - 使用保存的基准高度
    const time = Date.now() * 0.001;
    const offset = Math.sin(time * 2) * 0.3;
    this.mesh.position.y = this.baseY + offset;

    // 脉冲发光效果
    this.glowIntensity = Math.sin(time * 3) * 0.3 + 0.7;
    const material = (this.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = this.glowIntensity;

    // 更新光源强度
    const light = this.mesh.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight;
    if (light) {
      light.intensity = this.glowIntensity * 1.5;
    }
  }

  /**
   * 收集物品
   */
  public collect(): void {
    this.isCollected = true;
    this.mesh.visible = false; // 立即隐藏，不播放动画
  }

  /**
   * 检查玩家是否在交互范围内
   */
  public isInRange(playerPosition: THREE.Vector3): boolean {
    const distance = this.position.distanceTo(playerPosition);
    return distance < GAME_CONFIG.MECHANICS.INTERACTION_DISTANCE;
  }
}
