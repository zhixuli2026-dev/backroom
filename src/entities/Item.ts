import * as THREE from 'three';
import { Entity } from './Entity';

/**
 * 道具类型枚举
 */
export enum ItemType {
  BATTERY = 'battery',           // 电池
  ALMOND_WATER = 'almond_water', // 杏仁水
  ENERGY_DRINK = 'energy_drink', // 能量饮料
  KEY_CARD = 'key_card',         // 钥匙卡
  MAP_PIECE = 'map_piece',       // 地图碎片
  JAMMER = 'jammer',             // 干扰器
  DECOY = 'decoy',               // 诱饵
  SMOKE_BOMB = 'smoke_bomb',     // 烟雾弹
}

/**
 * 道具配置接口
 */
interface ItemConfig {
  type: ItemType;
  name: string;
  description: string;
  color: number;
  emissiveColor: number;
  effect: string;
  stackable: boolean;
  maxStack: number;
}

/**
 * 道具配置表
 */
export const ITEM_CONFIGS: Record<ItemType, ItemConfig> = {
  [ItemType.BATTERY]: {
    type: ItemType.BATTERY,
    name: '电池',
    description: '恢复50%手电筒电量',
    color: 0xffff00,
    emissiveColor: 0xffff00,
    effect: 'restore_battery_50',
    stackable: true,
    maxStack: 5,
  },
  [ItemType.ALMOND_WATER]: {
    type: ItemType.ALMOND_WATER,
    name: '杏仁水',
    description: '恢复1点生命值',
    color: 0xffeedd,
    emissiveColor: 0xffeedd,
    effect: 'restore_health_1',
    stackable: true,
    maxStack: 3,
  },
  [ItemType.ENERGY_DRINK]: {
    type: ItemType.ENERGY_DRINK,
    name: '能量饮料',
    description: '恢复50点体力',
    color: 0x00ff00,
    emissiveColor: 0x00ff00,
    effect: 'restore_stamina_50',
    stackable: true,
    maxStack: 5,
  },
  [ItemType.KEY_CARD]: {
    type: ItemType.KEY_CARD,
    name: '钥匙卡',
    description: '打开特定的门',
    color: 0x0088ff,
    emissiveColor: 0x0088ff,
    effect: 'unlock_door',
    stackable: false,
    maxStack: 1,
  },
  [ItemType.MAP_PIECE]: {
    type: ItemType.MAP_PIECE,
    name: '地图碎片',
    description: '显示部分地图区域',
    color: 0xcccccc,
    emissiveColor: 0xcccccc,
    effect: 'reveal_map',
    stackable: true,
    maxStack: 10,
  },
  [ItemType.JAMMER]: {
    type: ItemType.JAMMER,
    name: '干扰器',
    description: '10秒内怪物无法检测玩家',
    color: 0xff00ff,
    emissiveColor: 0xff00ff,
    effect: 'invisible_10s',
    stackable: true,
    maxStack: 3,
  },
  [ItemType.DECOY]: {
    type: ItemType.DECOY,
    name: '诱饵',
    description: '扔出后吸引怪物注意力',
    color: 0xff8800,
    emissiveColor: 0xff8800,
    effect: 'attract_monster',
    stackable: true,
    maxStack: 5,
  },
  [ItemType.SMOKE_BOMB]: {
    type: ItemType.SMOKE_BOMB,
    name: '烟雾弹',
    description: '制造烟雾阻挡视线',
    color: 0x888888,
    emissiveColor: 0x888888,
    effect: 'create_smoke',
    stackable: true,
    maxStack: 3,
  },
};

/**
 * 道具实体类
 */
export class Item extends Entity {
  public itemType: ItemType;
  public config: ItemConfig;
  public isPickedUp: boolean = false;
  private baseY: number; // 保存基准高度
  private pickupAnimationTime: number = 0; // 拾取动画计时器
  private pickupAnimationDuration: number = 0.15; // 拾取动画持续时间（秒）- 更快

  constructor(position: THREE.Vector3, itemType: ItemType) {
    const config = ITEM_CONFIGS[itemType];

    // 创建道具模型
    const itemGroup = new THREE.Group();

    // 主体（立方体）
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7,
    });
    const box = new THREE.Mesh(geometry, material);
    box.castShadow = true;
    itemGroup.add(box);

    // 外发光环
    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: config.emissiveColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    itemGroup.add(glow);

    // 点光源
    const light = new THREE.PointLight(config.color, 0.5, 3);
    light.position.set(0, 0, 0);
    itemGroup.add(light);

    itemGroup.position.copy(position);
    super(itemGroup);

    this.itemType = itemType;
    this.config = config;
    this.baseY = position.y; // 保存初始Y坐标
  }

  /**
   * 更新道具
   */
  public update(deltaTime: number): void {
    if (this.isPickedUp) {
      // 拾取动画：快速缩小
      this.pickupAnimationTime += deltaTime;
      const progress = Math.min(this.pickupAnimationTime / this.pickupAnimationDuration, 1);
      const scale = 1 - progress;

      this.mesh.scale.set(scale, scale, scale);

      if (progress >= 1) {
        this.mesh.visible = false;
      }
      return;
    }

    // 旋转动画
    this.mesh.rotation.y += deltaTime * 2;

    // 上下浮动 - 使用保存的基准高度
    const time = Date.now() * 0.001;
    const offset = Math.sin(time * 3) * 0.2;
    this.mesh.position.y = this.baseY + offset;

    // 脉冲发光
    const intensity = Math.sin(time * 4) * 0.3 + 0.7;
    const light = this.mesh.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight;
    if (light) {
      light.intensity = intensity * 0.5;
    }
  }

  /**
   * 拾取道具
   */
  public pickup(): void {
    this.isPickedUp = true;
    this.mesh.visible = false; // 立即隐藏，不播放动画
    console.log(`Picked up ${this.config.name}`);
  }

  /**
   * 检查是否在拾取范围内
   */
  public isInRange(playerPosition: THREE.Vector3, range: number = 2): boolean {
    const distance = this.position.distanceTo(playerPosition);
    return distance < range && !this.isPickedUp;
  }
}
