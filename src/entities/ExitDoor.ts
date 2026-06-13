import * as THREE from 'three';
import { Entity } from './Entity';
import { GAME_CONFIG } from '../config/constants';

/**
 * 出口门类 - 收集所有碎片后可通过
 */
export class ExitDoor extends Entity {
  private isUnlocked: boolean = false;
  private requiredCollectibles: number;
  private glowIntensity: number = 0;

  constructor(position: THREE.Vector3, requiredCollectibles: number) {
    // 创建门框
    const doorGroup = new THREE.Group();

    // 门框（金属材质）
    const frameGeometry = new THREE.BoxGeometry(2.5, 3, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    doorGroup.add(frame);

    // 门中心的能量场（未解锁时红色，解锁后绿色）
    const portalGeometry = new THREE.PlaneGeometry(2, 2.5);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.z = 0.05;
    portal.userData.isPortal = true;
    doorGroup.add(portal);

    // 添加外发光效果
    const glowGeometry = new THREE.PlaneGeometry(2.5, 3);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = 0.1;
    glow.userData.isGlow = true;
    doorGroup.add(glow);

    doorGroup.position.copy(position);
    super(doorGroup);

    this.requiredCollectibles = requiredCollectibles;

    // 添加点光源
    const light = new THREE.PointLight(0xff0000, 2, 10);
    light.position.set(0, 0, 1);
    this.mesh.add(light);
  }

  /**
   * 更新逻辑
   */
  public update(deltaTime: number): void {
    // 脉冲发光效果
    const time = Date.now() * 0.001;
    this.glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;

    // 更新门的材质
    const portal = this.mesh.children.find(child => child.userData.isPortal) as THREE.Mesh;
    if (portal) {
      const material = portal.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = this.glowIntensity * (this.isUnlocked ? 1 : 0.5);

      // 如果已解锁，添加旋转效果
      if (this.isUnlocked) {
        portal.rotation.z += deltaTime * 0.5;
      }
    }

    // 更新光源
    const light = this.mesh.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight;
    if (light) {
      light.intensity = this.glowIntensity * 2;
    }

    // 更新外发光
    const glow = this.mesh.children.find(child => child.userData.isGlow) as THREE.Mesh;
    if (glow) {
      const material = glow.material as THREE.MeshBasicMaterial;
      material.opacity = this.glowIntensity * 0.2;
    }
  }

  /**
   * 解锁出口门
   */
  public unlock(): void {
    this.isUnlocked = true;

    // 改变门的颜色为绿色
    const portal = this.mesh.children.find(child => child.userData.isPortal) as THREE.Mesh;
    if (portal) {
      const material = portal.material as THREE.MeshStandardMaterial;
      material.color.setHex(0x00ff00);
      material.emissive.setHex(0x00ff00);
      material.emissiveIntensity = 1;
    }

    // 改变外发光颜色
    const glow = this.mesh.children.find(child => child.userData.isGlow) as THREE.Mesh;
    if (glow) {
      const material = glow.material as THREE.MeshBasicMaterial;
      material.color.setHex(0x00ff00);
    }

    // 改变光源颜色
    const light = this.mesh.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight;
    if (light) {
      light.color.setHex(0x00ff00);
    }

    console.log('Exit door unlocked!');
  }

  /**
   * 检查玩家是否在交互范围内
   */
  public isInRange(playerPosition: THREE.Vector3): boolean {
    const distance = this.position.distanceTo(playerPosition);
    return distance < GAME_CONFIG.MECHANICS.INTERACTION_DISTANCE;
  }

  /**
   * 检查门是否已解锁
   */
  public isUnlockedState(): boolean {
    return this.isUnlocked;
  }
}
