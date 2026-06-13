import * as THREE from 'three';
import { Room } from './Room';
import { GAME_CONFIG } from '../config/constants';
import { Collider } from '../utils/Collision';

/**
 * 地图生成器 - 生成后室迷宫
 */
export class MapGenerator {
  private rooms: Room[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 生成简单的固定地图（L形布局）
   */
  public generateSimpleMap(): { rooms: Room[]; colliders: Collider[]; spawnPoint: THREE.Vector3 } {
    const roomSize = GAME_CONFIG.ROOM.WIDTH;

    // 创建L形走廊布局
    const roomPositions = [
      { x: 0, z: 0 },           // 起始房间
      { x: roomSize, z: 0 },    // 东侧房间
      { x: roomSize * 2, z: 0 }, // 东侧房间2
      { x: 0, z: roomSize },    // 南侧房间
      { x: 0, z: roomSize * 2 }, // 南侧房间2
    ];

    // 创建房间
    roomPositions.forEach(pos => {
      const room = new Room(pos.x, pos.z);
      this.rooms.push(room);
      this.scene.add(room.mesh);
    });

    // 移除相邻房间之间的墙
    this.connectRooms();

    // 在移除墙之后重新收集所有碰撞体
    const allColliders: Collider[] = [];
    this.rooms.forEach(room => {
      allColliders.push(...room.colliders);
    });

    // 玩家出生点（第一个房间的中心，地面上）
    // 房间0的世界坐标中心是 (0, 0, 0)
    const spawnPoint = new THREE.Vector3(
      0,
      0, // 地面高度，相机高度在Player类中设置
      0
    );

    console.log(`Generated map with ${this.rooms.length} rooms`);

    return {
      rooms: this.rooms,
      colliders: allColliders,
      spawnPoint
    };
  }

  /**
   * 更新所有房间
   */
  public update(deltaTime: number): void {
    this.rooms.forEach(room => room.update(deltaTime));
  }

  /**
   * 连接相邻的房间（移除共享的墙）
   */
  private connectRooms(): void {
    const roomSize = GAME_CONFIG.ROOM.WIDTH;

    // 手动定义连接关系（基于上面的布局）
    const connections = [
      { from: 0, to: 1, direction: 'east' as const },  // 房间0连接房间1
      { from: 1, to: 2, direction: 'east' as const },  // 房间1连接房间2
      { from: 0, to: 3, direction: 'south' as const }, // 房间0连接房间3
      { from: 3, to: 4, direction: 'south' as const }, // 房间3连接房间4
    ];

    connections.forEach(conn => {
      const fromRoom = this.rooms[conn.from];
      const toRoom = this.rooms[conn.to];

      if (fromRoom && toRoom) {
        // 移除起始房间的墙
        fromRoom.removeWall(conn.direction);

        // 移除目标房间相对的墙
        const oppositeDirection = this.getOppositeDirection(conn.direction);
        toRoom.removeWall(oppositeDirection);
      }
    });
  }

  /**
   * 获取相反的方向
   */
  private getOppositeDirection(direction: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
    const opposites = {
      north: 'south' as const,
      south: 'north' as const,
      east: 'west' as const,
      west: 'east' as const,
    };
    return opposites[direction];
  }

  /**
   * 生成程序化地图（未来实现）
   */
  public generateProceduralMap(width: number, height: number): void {
    // TODO: 实现程序化生成算法
    console.log('Procedural map generation not yet implemented');
  }

  /**
   * 清除地图
   */
  public clearMap(): void {
    this.rooms.forEach(room => {
      this.scene.remove(room.mesh);
    });
    this.rooms = [];
  }

  /**
   * 获取所有房间
   */
  public getRooms(): Room[] {
    return this.rooms;
  }
}
