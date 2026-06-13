import { ItemType, ITEM_CONFIGS } from '../entities/Item';

/**
 * 背包物品槽
 */
export interface InventorySlot {
  itemType: ItemType | null;
  quantity: number;
}

/**
 * 背包系统
 */
export class Inventory {
  private slots: InventorySlot[];
  private maxSlots: number = 6;

  constructor() {
    this.slots = Array.from({ length: this.maxSlots }, () => ({
      itemType: null,
      quantity: 0,
    }));
  }

  /**
   * 添加物品
   */
  public addItem(itemType: ItemType): boolean {
    const config = ITEM_CONFIGS[itemType];

    // 如果可堆叠，先尝试堆叠到现有槽位
    if (config.stackable) {
      const existingSlot = this.slots.find(
        slot => slot.itemType === itemType && slot.quantity < config.maxStack
      );

      if (existingSlot) {
        existingSlot.quantity++;
        console.log(`Stacked ${config.name}. Quantity: ${existingSlot.quantity}`);
        return true;
      }
    }

    // 找到空槽位
    const emptySlot = this.slots.find(slot => slot.itemType === null);
    if (emptySlot) {
      emptySlot.itemType = itemType;
      emptySlot.quantity = 1;
      console.log(`Added ${config.name} to inventory`);
      return true;
    }

    console.log('Inventory full!');
    return false;
  }

  /**
   * 使用物品
   */
  public useItem(slotIndex: number): ItemType | null {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      return null;
    }

    const slot = this.slots[slotIndex];
    if (slot.itemType === null || slot.quantity === 0) {
      return null;
    }

    const itemType = slot.itemType;
    slot.quantity--;

    // 如果数量为0，清空槽位
    if (slot.quantity === 0) {
      slot.itemType = null;
    }

    const config = ITEM_CONFIGS[itemType];
    console.log(`Used ${config.name}`);

    return itemType;
  }

  /**
   * 丢弃物品
   */
  public dropItem(slotIndex: number): ItemType | null {
    if (slotIndex < 0 || slotIndex >= this.maxSlots) {
      return null;
    }

    const slot = this.slots[slotIndex];
    if (slot.itemType === null) {
      return null;
    }

    const itemType = slot.itemType;
    slot.quantity--;

    if (slot.quantity === 0) {
      slot.itemType = null;
    }

    const config = ITEM_CONFIGS[itemType];
    console.log(`Dropped ${config.name}`);

    return itemType;
  }

  /**
   * 获取槽位
   */
  public getSlots(): InventorySlot[] {
    return this.slots;
  }

  /**
   * 获取物品数量
   */
  public getItemCount(itemType: ItemType): number {
    return this.slots
      .filter(slot => slot.itemType === itemType)
      .reduce((sum, slot) => sum + slot.quantity, 0);
  }

  /**
   * 检查是否有物品
   */
  public hasItem(itemType: ItemType): boolean {
    return this.getItemCount(itemType) > 0;
  }

  /**
   * 检查背包是否已满
   */
  public isFull(): boolean {
    return this.slots.every(slot => slot.itemType !== null);
  }

  /**
   * 清空背包
   */
  public clear(): void {
    this.slots.forEach(slot => {
      slot.itemType = null;
      slot.quantity = 0;
    });
  }
}
