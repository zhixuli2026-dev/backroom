import * as THREE from 'three';

/**
 * 碰撞检测工具类
 */
export class CollisionDetector {
  /**
   * AABB (轴对齐包围盒) 碰撞检测
   */
  public static checkAABB(box1: THREE.Box3, box2: THREE.Box3): boolean {
    return box1.intersectsBox(box2);
  }

  /**
   * 射线碰撞检测
   */
  public static rayCast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    objects: THREE.Object3D[],
    maxDistance: number = Infinity
  ): THREE.Intersection | null {
    const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
    const intersects = raycaster.intersectObjects(objects, true);
    return intersects.length > 0 ? intersects[0] : null;
  }

  /**
   * 球体碰撞检测
   */
  public static checkSphere(sphere1: THREE.Sphere, sphere2: THREE.Sphere): boolean {
    return sphere1.intersectsSphere(sphere2);
  }

  /**
   * 获取对象的包围盒
   */
  public static getBoundingBox(object: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3();
    box.setFromObject(object);
    return box;
  }

  /**
   * 检查点是否在包围盒内
   */
  public static isPointInBox(point: THREE.Vector3, box: THREE.Box3): boolean {
    return box.containsPoint(point);
  }
}

/**
 * 碰撞体类 - 为游戏对象添加碰撞功能
 */
export class Collider {
  public boundingBox: THREE.Box3;
  public position: THREE.Vector3;
  public size: THREE.Vector3;
  public userData: any = {}; // 用户数据，用于标记碰撞体属性

  constructor(position: THREE.Vector3, size: THREE.Vector3) {
    this.position = position;
    this.size = size;
    this.boundingBox = new THREE.Box3();
    this.updateBoundingBox();
  }

  /**
   * 更新包围盒位置
   */
  public updateBoundingBox(): void {
    const halfSize = this.size.clone().multiplyScalar(0.5);
    this.boundingBox.min.copy(this.position).sub(halfSize);
    this.boundingBox.max.copy(this.position).add(halfSize);
  }

  /**
   * 检测与另一个碰撞体的碰撞
   */
  public intersects(other: Collider): boolean {
    return CollisionDetector.checkAABB(this.boundingBox, other.boundingBox);
  }

  /**
   * 获取碰撞穿透深度和方向
   */
  public getPenetration(other: Collider): { depth: number; direction: THREE.Vector3 } | null {
    if (!this.intersects(other)) return null;

    const dx = this.position.x - other.position.x;
    const dz = this.position.z - other.position.z;

    const overlapX = (this.size.x + other.size.x) / 2 - Math.abs(dx);
    const overlapZ = (this.size.z + other.size.z) / 2 - Math.abs(dz);

    // 选择穿透最少的轴
    if (overlapX < overlapZ) {
      return {
        depth: overlapX,
        direction: new THREE.Vector3(dx > 0 ? 1 : -1, 0, 0)
      };
    } else {
      return {
        depth: overlapZ,
        direction: new THREE.Vector3(0, 0, dz > 0 ? 1 : -1)
      };
    }
  }
}
