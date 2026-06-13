import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { Player } from '../entities/Player';
import { Collectible } from '../entities/Collectible';
import { ExitDoor } from '../entities/ExitDoor';
import { Monster } from '../entities/Monster';
import { Item, ItemType } from '../entities/Item';
import { MapGenerator } from '../world/MapGenerator';
import { Collider } from '../utils/Collision';
import { GAME_CONFIG, KEYS } from '../config/constants';
import * as THREE from 'three';

/**
 * 游戏主类 - 管理游戏循环和核心系统
 */
export class Game {
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private player: Player;
  private mapGenerator: MapGenerator;
  private lastTime = 0;
  private isRunning = false;
  private colliders: Collider[] = []; // 场景中的碰撞体

  // 游戏对象
  private collectibles: Collectible[] = [];
  private items: Item[] = [];
  private exitDoor?: ExitDoor;
  private monsters: Monster[] = [];
  private collectedCount: number = 0;
  private totalCollectibles: number = GAME_CONFIG.MECHANICS.COLLECTIBLE_COUNT;

  // 游戏状态
  private gameWon: boolean = false;
  private gameLost: boolean = false;

  constructor(container: HTMLElement) {
    this.sceneManager = new SceneManager(container);
    this.inputManager = new InputManager();
    this.mapGenerator = new MapGenerator(this.sceneManager.scene);

    // 创建地图
    const mapData = this.mapGenerator.generateSimpleMap();
    this.colliders = mapData.colliders;

    // 创建玩家（使用地图的出生点）
    this.player = new Player(this.sceneManager.camera, this.inputManager, this.sceneManager.scene);
    this.player.position.copy(mapData.spawnPoint);
    this.player.addToScene(this.sceneManager.scene);

    // 放置收集物品和出口门
    this.placeGameObjects();

    // 放置道具
    this.spawnItems();

    // 生成怪物
    this.spawnMonsters();

    console.log('Game initialized');
  }

  /**
   * 放置游戏对象（收集品和出口门）
   */
  private placeGameObjects(): void {
    const roomSize = GAME_CONFIG.ROOM.WIDTH;

    // 在不同房间放置收集品
    // 房间布局（世界坐标）：
    // 房间0: X=-5到5, Z=-5到5
    // 房间1: X=5到15, Z=-5到5
    // 房间2: X=15到25, Z=-5到5
    // 房间3: X=-5到5, Z=5到15
    // 房间4: X=-5到5, Z=15到25
    const collectiblePositions = [
      new THREE.Vector3(10, 1, 0),  // 房间1 中心
      new THREE.Vector3(20, 1, 0),  // 房间2 中心
      new THREE.Vector3(0, 1, 10),  // 房间3 中心
      new THREE.Vector3(0, 1, 20),  // 房间4 中心
    ];

    // 只取前 totalCollectibles 个位置
    for (let i = 0; i < Math.min(this.totalCollectibles, collectiblePositions.length); i++) {
      const collectible = new Collectible(collectiblePositions[i]);
      this.collectibles.push(collectible);
      collectible.addToScene(this.sceneManager.scene);
    }

    // 在最后一个房间放置出口门 (房间4的后方)
    const doorPosition = new THREE.Vector3(0, 1.5, 23);
    this.exitDoor = new ExitDoor(doorPosition, this.totalCollectibles);
    this.exitDoor.addToScene(this.sceneManager.scene);

    console.log(`Placed ${this.collectibles.length} collectibles and 1 exit door`);

    // 更新UI
    this.updateUI();
  }

  /**
   * 生成怪物
   */
  private spawnMonsters(): void {
    // 房间布局（世界坐标）：
    // 房间1: X=5到15, Z=-5到5
    // 房间3: X=-5到5, Z=5到15

    // 怪物1：在房间1内巡逻
    const monster1PatrolPoints = [
      new THREE.Vector3(8, 0, 0),   // 房间1左侧
      new THREE.Vector3(12, 0, 0),  // 房间1右侧
    ];
    const monster1Pos = new THREE.Vector3(10, 0, 0); // 房间1中心
    const monster1 = new Monster(monster1Pos, monster1PatrolPoints);
    this.monsters.push(monster1);
    monster1.addToScene(this.sceneManager.scene);
    console.log(`Monster 1 spawned at (${monster1Pos.x}, ${monster1Pos.y}, ${monster1Pos.z})`);

    // 怪物2：在房间3内巡逻
    const monster2PatrolPoints = [
      new THREE.Vector3(0, 0, 8),   // 房间3上方
      new THREE.Vector3(0, 0, 12),  // 房间3下方
    ];
    const monster2Pos = new THREE.Vector3(0, 0, 10); // 房间3中心
    const monster2 = new Monster(monster2Pos, monster2PatrolPoints);
    this.monsters.push(monster2);
    monster2.addToScene(this.sceneManager.scene);
    console.log(`Monster 2 spawned at (${monster2Pos.x}, ${monster2Pos.y}, ${monster2Pos.z})`);

    console.log(`Spawned ${this.monsters.length} monsters`);
  }

  /**
   * 生成道具
   */
  private spawnItems(): void {
    // 房间布局（世界坐标）：
    // 房间0: X=-5到5, Z=-5到5
    // 房间1: X=5到15, Z=-5到5
    // 房间2: X=15到25, Z=-5到5
    // 房间3: X=-5到5, Z=5到15
    // 房间4: X=-5到5, Z=15到25

    const itemConfigs = [
      // 房间0 - 出生点附近
      { position: new THREE.Vector3(-2, 0.5, -2), type: ItemType.BATTERY },
      { position: new THREE.Vector3(2, 0.5, 2), type: ItemType.BATTERY },

      // 房间1 - 东侧第一个房间
      { position: new THREE.Vector3(8, 0.5, 0), type: ItemType.ALMOND_WATER },
      { position: new THREE.Vector3(12, 0.5, -2), type: ItemType.JAMMER },

      // 房间2 - 东侧第二个房间
      { position: new THREE.Vector3(20, 0.5, 0), type: ItemType.ENERGY_DRINK },

      // 房间3 - 南侧第一个房间
      { position: new THREE.Vector3(-2, 0.5, 10), type: ItemType.DECOY },

      // 房间4 - 南侧第二个房间
      { position: new THREE.Vector3(0, 0.5, 20), type: ItemType.BATTERY },
    ];

    itemConfigs.forEach(config => {
      const item = new Item(config.position, config.type);
      this.items.push(item);
      item.addToScene(this.sceneManager.scene);
    });

    console.log(`Spawned ${this.items.length} items`);
  }

  /**
   * 启动游戏
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();

    // 隐藏加载界面
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    console.log('Game started');
  }

  /**
   * 游戏主循环
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 转换为秒
    this.lastTime = currentTime;

    // 更新游戏逻辑
    this.update(deltaTime);

    // 渲染场景
    this.sceneManager.render();

    // 请求下一帧
    requestAnimationFrame(this.gameLoop);
  };

  /**
   * 更新游戏逻辑
   */
  private update(deltaTime: number): void {
    // 检查重启键（游戏结束时）
    if (this.gameWon || this.gameLost) {
      if (this.inputManager.isKeyJustPressed('KeyR')) {
        this.restartGame();
      }
      this.inputManager.update(); // 清理按键状态
      return;
    }

    // 更新玩家
    this.player.update(deltaTime);

    // 检查玩家是否死亡
    if (!this.player.stats.isAlive()) {
      this.loseGame();
      return;
    }

    // 更新地图（灯光闪烁等效果）
    this.mapGenerator.update(deltaTime);

    // 更新收集品
    this.collectibles.forEach(collectible => collectible.update(deltaTime));

    // 更新道具
    this.items.forEach(item => item.update(deltaTime));

    // 更新出口门
    if (this.exitDoor) {
      this.exitDoor.update(deltaTime);
    }

    // 更新怪物和处理攻击
    this.updateMonsters(deltaTime);

    // 检测并解决碰撞
    this.handleCollisions();

    // 检测交互
    this.handleInteractions();

    // 更新UI
    this.updateHUD();

    // 在帧结束时清理输入状态
    this.inputManager.update();
  }

  /**
   * 更新怪物和处理攻击
   */
  private updateMonsters(deltaTime: number): void {
    this.monsters.forEach(monster => {
      monster.update(deltaTime);

      // 怪物检测玩家（考虑隐身效果）
      const detectionRange = GAME_CONFIG.MONSTER.DETECTION_RANGE * this.player.getStealthMultiplier();
      const distance = monster.position.distanceTo(this.player.position);

      if (distance < detectionRange) {
        monster.detectPlayer(this.player.position);
      }

      // 尝试攻击玩家
      const attackResult = monster.tryAttackPlayer(this.player.position);
      if (attackResult.success && attackResult.knockbackDirection) {
        // 玩家受到伤害
        const damaged = this.player.takeDamage(1);

        if (damaged) {
          // 应用击退效果
          this.player.applyKnockback(attackResult.knockbackDirection, 5);
          console.log(`Player hit! Health: ${this.player.stats.currentHealth}/${this.player.stats.maxHealth}`);
        }
      }
    });
  }

  /**
   * 处理碰撞检测
   */
  private handleCollisions(): void {
    // 玩家与墙的碰撞
    for (const collider of this.colliders) {
      if (this.player.collider.intersects(collider)) {
        this.player.resolveCollision(collider);
      }
    }

    // 怪物与墙的碰撞
    for (const monster of this.monsters) {
      for (const collider of this.colliders) {
        if (monster.collider.intersects(collider)) {
          monster.resolveCollision(collider);
        }
      }
    }
  }

  /**
   * 处理交互（收集物品、通过出口门）
   */
  private handleInteractions(): void {
    // 检查道具拾取
    for (const item of this.items) {
      if (!item.isPickedUp && item.isInRange(this.player.position)) {
        this.showInteractionHint(`按 E 键拾取 ${item.config.name}`);

        if (this.inputManager.isKeyJustPressed(KEYS.INTERACT)) {
          this.pickupItem(item);
        }
        return;
      }
    }

    // 检查收集物品
    for (const collectible of this.collectibles) {
      if (!collectible.isCollected && collectible.isInRange(this.player.position)) {
        this.showInteractionHint('按 E 键收集');

        // 按E键收集
        if (this.inputManager.isKeyJustPressed(KEYS.INTERACT)) {
          this.collectItem(collectible);
        }
        return; // 一次只显示一个提示
      }
    }

    // 检查出口门
    if (this.exitDoor && this.exitDoor.isInRange(this.player.position)) {
      if (this.exitDoor.isUnlockedState()) {
        this.showInteractionHint('按 E 键离开后室');

        if (this.inputManager.isKeyJustPressed(KEYS.INTERACT)) {
          this.winGame();
        }
      } else {
        this.showInteractionHint(`需要收集所有碎片 (${this.collectedCount}/${this.totalCollectibles})`);
      }
      return;
    }

    // 没有可交互的对象
    this.hideInteractionHint();
  }

  /**
   * 拾取道具
   */
  private pickupItem(item: Item): void {
    const success = this.player.inventory.addItem(item.itemType);

    if (success) {
      item.pickup();
      console.log(`Picked up ${item.config.name}`);
    } else {
      console.log('Inventory full!');
    }
  }

  /**
   * 收集物品
   */
  private collectItem(collectible: Collectible): void {
    collectible.collect();
    this.collectedCount++;

    console.log(`Collected item ${this.collectedCount}/${this.totalCollectibles}`);

    // 更新UI
    this.updateUI();

    // 如果收集完所有物品，解锁出口门
    if (this.collectedCount >= this.totalCollectibles && this.exitDoor) {
      this.exitDoor.unlock();
      this.showMessage('出口已解锁！', 3000);
    }
  }

  /**
   * 胜利
   */
  private winGame(): void {
    this.gameWon = true;
    this.showMessage('成功逃离后室！🎉\n\n按 R 键重新开始', 0);
    console.log('Game won!');
  }

  /**
   * 失败
   */
  private loseGame(): void {
    this.gameLost = true;
    this.showMessage('你被抓住了...💀\n\n按 R 键重新开始', 0);
    console.log('Game lost!');
  }

  /**
   * 重启游戏
   */
  private restartGame(): void {
    console.log('Restarting game...');

    // 重置游戏状态
    this.gameWon = false;
    this.gameLost = false;
    this.collectedCount = 0;

    // 清理旧的游戏对象
    this.collectibles.forEach(c => c.removeFromScene(this.sceneManager.scene));
    this.items.forEach(i => i.removeFromScene(this.sceneManager.scene));
    this.monsters.forEach(m => m.removeFromScene(this.sceneManager.scene));
    if (this.exitDoor) {
      this.exitDoor.removeFromScene(this.sceneManager.scene);
    }

    // 清空数组
    this.collectibles = [];
    this.items = [];
    this.monsters = [];

    // 重置玩家
    const roomSize = GAME_CONFIG.ROOM.WIDTH;
    const spawnPoint = new THREE.Vector3(roomSize / 2, 0, roomSize / 2);
    this.player.position.copy(spawnPoint);
    this.player.reset();

    // 重新生成游戏对象
    this.placeGameObjects();
    this.spawnItems();
    this.spawnMonsters();

    // 隐藏消息
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
      messageElement.style.display = 'none';
    }

    // 更新UI
    this.updateUI();
    this.updateHUD();

    console.log('Game restarted');
  }

  /**
   * 导入需要的配置
   */
  private ITEM_CONFIGS = {
    [ItemType.BATTERY]: { name: '电池' },
    [ItemType.ALMOND_WATER]: { name: '杏仁水' },
    [ItemType.ENERGY_DRINK]: { name: '能量饮料' },
    [ItemType.KEY_CARD]: { name: '钥匙卡' },
    [ItemType.MAP_PIECE]: { name: '地图碎片' },
    [ItemType.JAMMER]: { name: '干扰器' },
    [ItemType.DECOY]: { name: '诱饵' },
    [ItemType.SMOKE_BOMB]: { name: '烟雾弹' },
  };

  /**
   * 更新UI
   */
  private updateUI(): void {
    const objectiveElement = document.getElementById('objective');
    if (objectiveElement) {
      objectiveElement.textContent = `目标：收集碎片 ${this.collectedCount}/${this.totalCollectibles}`;
    }
  }

  /**
   * 更新HUD（生命值、体力、手电筒、背包等）
   */
  private updateHUD(): void {
    // 更新生命值
    const healthElement = document.getElementById('health');
    if (healthElement) {
      const hearts = '❤️'.repeat(this.player.stats.currentHealth) +
                     '🖤'.repeat(this.player.stats.maxHealth - this.player.stats.currentHealth);
      healthElement.textContent = `生命: ${hearts}`;
    }

    // 更新体力
    const staminaElement = document.getElementById('stamina');
    if (staminaElement) {
      const percentage = Math.floor(this.player.stats.getStaminaPercentage() * 100);
      staminaElement.textContent = `体力: ${percentage}%`;
    }

    // 更新手电筒电量
    const batteryElement = document.getElementById('battery');
    if (batteryElement) {
      const percentage = Math.floor(this.player.flashlight.getBatteryPercentage() * 100);
      const mode = this.player.flashlight.currentMode;
      batteryElement.textContent = `手电筒: ${percentage}% [${mode}]`;
    }

    // 更新背包
    const inventoryElement = document.getElementById('inventory');
    if (inventoryElement) {
      const slots = this.player.inventory.getSlots();
      let inventoryText = '背包: ';
      slots.forEach((slot, index) => {
        if (slot.itemType) {
          inventoryText += `[${index + 1}:${slot.quantity}] `;
        } else {
          inventoryText += `[${index + 1}:_] `;
        }
      });
      inventoryElement.textContent = inventoryText;
    }
  }

  /**
   * 显示交互提示
   */
  private showInteractionHint(text: string): void {
    const hintElement = document.getElementById('interaction-hint');
    if (hintElement) {
      hintElement.textContent = text;
      hintElement.style.display = 'block';
    }
  }

  /**
   * 隐藏交互提示
   */
  private hideInteractionHint(): void {
    const hintElement = document.getElementById('interaction-hint');
    if (hintElement) {
      hintElement.style.display = 'none';
    }
  }

  /**
   * 显示消息
   */
  private showMessage(text: string, duration: number = 3000): void {
    const messageElement = document.getElementById('game-message');
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.style.display = 'block';

      if (duration > 0) {
        setTimeout(() => {
          messageElement.style.display = 'none';
        }, duration);
      }
    }
  }

  /**
   * 停止游戏
   */
  public stop(): void {
    this.isRunning = false;
    console.log('Game stopped');
  }

  /**
   * 销毁游戏实例
   */
  public dispose(): void {
    this.stop();
    this.mapGenerator.clearMap();
    this.sceneManager.dispose();
    this.inputManager.dispose();
    console.log('Game disposed');
  }
}
