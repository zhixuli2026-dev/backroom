import * as THREE from 'three';

/**
 * 实体基类 - 所有游戏实体的父类
 */
export abstract class Entity {
  public mesh: THREE.Object3D;
  public position: THREE.Vector3;
  public rotation: THREE.Euler;

  constructor(mesh: THREE.Object3D) {
    this.mesh = mesh;
    this.position = mesh.position;
    this.rotation = mesh.rotation;
  }

  /**
   * 更新实体逻辑
   */
  public abstract update(deltaTime: number): void;

  /**
   * 添加到场景
   */
  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  /**
   * 从场景移除
   */
  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}
