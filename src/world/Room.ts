import * as THREE from 'three';
import { GAME_CONFIG } from '../config/constants';
import { Collider } from '../utils/Collision';

/**
 * 房间类 - 后室的基础单元
 */
export class Room {
  public mesh: THREE.Group;
  public colliders: Collider[] = [];
  public position: THREE.Vector3;

  constructor(x: number, z: number) {
    this.position = new THREE.Vector3(x, 0, z);
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    this.createRoom();
  }

  /**
   * 创建房间结构
   */
  private createRoom(): void {
    const width = GAME_CONFIG.ROOM.WIDTH;
    const height = GAME_CONFIG.ROOM.HEIGHT;
    const depth = GAME_CONFIG.ROOM.DEPTH;
    const wallThickness = GAME_CONFIG.ROOM.WALL_THICKNESS;

    // 创建材质
    const wallMaterial = this.createWallMaterial();
    const floorMaterial = this.createFloorMaterial();
    const ceilingMaterial = this.createCeilingMaterial();

    // 地面
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.mesh.add(floor);

    // 天花板
    const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    ceiling.receiveShadow = true;
    this.mesh.add(ceiling);

    // 墙壁（暂时创建四面墙，后续会根据邻接关系移除）
    this.createWalls(width, height, depth, wallThickness, wallMaterial);

    // 添加荧光灯
    this.addFluorescentLights(width, depth, height);
  }

  /**
   * 创建墙壁材质（泛黄的墙纸）
   */
  private createWallMaterial(): THREE.MeshStandardMaterial {
    // 创建程序化纹理 - 提高分辨率
    const canvas = document.createElement('canvas');
    canvas.width = 2048;  // 从512提升到2048
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 基础颜色 - 泛黄的墙壁
    ctx.fillStyle = '#e8e5b5';
    ctx.fillRect(0, 0, 2048, 2048);

    // 添加污渍和噪点 - 增加数量以匹配分辨率
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const size = Math.random() * 3 + 1;
      const opacity = Math.random() * 0.15;

      ctx.fillStyle = `rgba(139, 115, 85, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 添加水渍 - 增加数量
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const size = Math.random() * 320 + 160;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.2)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0,
    });
  }

  /**
   * 创建地面材质（棕色地毯）
   */
  private createFloorMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;  // 从512提升到2048
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 基础地毯颜色
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, 0, 2048, 2048);

    // 添加地毯纤维纹理 - 增加数量
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const length = Math.random() * 3 + 1;
      const angle = Math.random() * Math.PI * 2;
      const opacity = Math.random() * 0.3 + 0.1;

      ctx.strokeStyle = `rgba(${100 + Math.random() * 50}, ${80 + Math.random() * 40}, ${60 + Math.random() * 30}, ${opacity})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    // 添加污渍 - 增加数量
    for (let i = 0; i < 32; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 2048;
      const size = Math.random() * 240 + 120;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(50, 40, 30, 0.3)');
      gradient.addColorStop(1, 'rgba(50, 40, 30, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0,
    });
  }

  /**
   * 创建天花板材质（米色吊顶）
   */
  private createCeilingMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;  // 从512提升到2048
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 基础颜色
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, 2048, 2048);

    // 添加吊顶板纹理（格子） - 调整网格大小
    ctx.strokeStyle = '#d0d0c0';
    ctx.lineWidth = 3;

    const gridSize = 256;  // 从64提升到256
    for (let i = 0; i <= 2048; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 2048);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(2048, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0,
    });
  }

  /**
   * 创建墙壁
   */
  private createWalls(width: number, height: number, depth: number, thickness: number, material: THREE.Material): void {
    // 北墙
    this.createWall(width, height, thickness, 0, height / 2, -depth / 2, material, 'north');

    // 南墙
    this.createWall(width, height, thickness, 0, height / 2, depth / 2, material, 'south');

    // 东墙
    this.createWall(thickness, height, depth, width / 2, height / 2, 0, material, 'east');

    // 西墙
    this.createWall(thickness, height, depth, -width / 2, height / 2, 0, material, 'west');
  }

  /**
   * 创建单面墙
   */
  private createWall(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    direction: string
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.userData.direction = direction;
    this.mesh.add(wall);

    // 添加碰撞体（世界坐标）
    const worldPos = new THREE.Vector3(x, y, z).add(this.position);
    const collider = new Collider(worldPos, new THREE.Vector3(width, height, depth));
    collider.userData = { direction }; // 标记碰撞体的方向
    this.colliders.push(collider);
  }

  /**
   * 添加荧光灯
   */
  private addFluorescentLights(width: number, depth: number, height: number): void {
    const lightCount = 2;
    const spacing = width / (lightCount + 1);

    for (let i = 0; i < lightCount; i++) {
      const x = -width / 2 + spacing * (i + 1);

      // 灯具模型（简化的长方形）
      const lightGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
      const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffebb3,
        emissiveIntensity: 0.8,
      });
      const lightFixture = new THREE.Mesh(lightGeometry, lightMaterial);
      lightFixture.position.set(x, height - 0.2, 0);
      this.mesh.add(lightFixture);

      // 点光源
      const pointLight = new THREE.PointLight(GAME_CONFIG.COLORS.LIGHT, 1.2, 15);
      pointLight.position.set(x, height - 0.5, 0);
      pointLight.castShadow = true;
      pointLight.shadow.mapSize.width = 512;
      pointLight.shadow.mapSize.height = 512;
      pointLight.shadow.bias = -0.001;

      // 添加随机闪烁效果
      const flickerData = {
        baseIntensity: 1.2,
        flickerSpeed: Math.random() * 2 + 1,
        flickerAmount: Math.random() * 0.3 + 0.1,
        nextFlickerTime: Math.random() * 5 + 2,
      };
      pointLight.userData.flickerData = flickerData;

      this.mesh.add(pointLight);
    }
  }

  /**
   * 更新房间（处理灯光闪烁等动态效果）
   */
  public update(deltaTime: number): void {
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.PointLight && child.userData.flickerData) {
        const data = child.userData.flickerData;

        // 更新闪烁计时器
        data.nextFlickerTime -= deltaTime;

        if (data.nextFlickerTime <= 0) {
          // 执行闪烁
          const flicker = Math.random() * data.flickerAmount;
          child.intensity = data.baseIntensity + (Math.random() > 0.5 ? flicker : -flicker);

          // 重置计时器（随机间隔）
          data.nextFlickerTime = Math.random() * 8 + 2;
        } else {
          // 平滑回归基础强度
          child.intensity += (data.baseIntensity - child.intensity) * deltaTime * 2;
        }
      }
    });
  }

  /**
   * 移除特定方向的墙（用于连接房间）
   */
  public removeWall(direction: 'north' | 'south' | 'east' | 'west'): void {
    // 移除视觉模型
    const wallToRemove = this.mesh.children.find(
      child => child.userData.direction === direction
    );

    if (wallToRemove) {
      this.mesh.remove(wallToRemove);

      // 移除对应的碰撞体
      this.colliders = this.colliders.filter(collider => {
        // 保留所有不是这个方向的碰撞体
        return !(collider.userData && collider.userData.direction === direction);
      });
    }
  }
}
