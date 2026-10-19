export interface ShopItem {
  id: 'cleanSpeed' | 'cleanRange' | 'coinBonus';
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  canBuy: boolean;
}

export interface UpgradeValues {
  cleanSpeed: number;
  cleanRange: number;
  coinMultiplier: number;
}

export class Shop {
  coins = 0;
  private levels = {
    cleanSpeed: 1,
    cleanRange: 1,
    coinBonus: 1
  };
  onUpdate?: () => void;
  onValuesChanged?: (values: UpgradeValues) => void;

  private costs = {
    cleanSpeed: [40, 80, 9999],
    cleanRange: [30, 70, 9999],
    coinBonus: [50, 100, 9999]
  };

  private speedByLevel = [18, 28, 40];
  private rangeByLevel = [1.6, 2.3, 3.2];
  private coinByLevel = [1, 1.5, 2];

  addCoins(amount: number) {
    this.coins += amount;
    this.notify();
  }

  spend(amount: number) {
    this.coins -= amount;
    this.notify();
  }

  buy(id: keyof typeof this.levels) {
    const lvl = this.levels[id];
    if (lvl >= 3) return;
    const cost = this.costs[id][lvl - 1];
    if (this.coins < cost) return;
    this.coins -= cost;
    this.levels[id] = lvl + 1;
    this.notify();
    if (this.onValuesChanged) {
      this.onValuesChanged(this.getValues());
    }
  }

  getValues(): UpgradeValues {
    return {
      cleanSpeed: this.speedByLevel[this.levels.cleanSpeed - 1],
      cleanRange: this.rangeByLevel[this.levels.cleanRange - 1],
      coinMultiplier: this.coinByLevel[this.levels.coinBonus - 1]
    };
  }

  getItems(): ShopItem[] {
    const items: ShopItem[] = [
      { id: 'cleanSpeed', name: 'Cleaning Speed', level: this.levels.cleanSpeed, maxLevel: 3, cost: this.costs.cleanSpeed[this.levels.cleanSpeed - 1], canBuy: this.levels.cleanSpeed < 3 && this.coins >= this.costs.cleanSpeed[this.levels.cleanSpeed - 1] },
      { id: 'cleanRange', name: 'Cleaning Range', level: this.levels.cleanRange, maxLevel: 3, cost: this.costs.cleanRange[this.levels.cleanRange - 1], canBuy: this.levels.cleanRange < 3 && this.coins >= this.costs.cleanRange[this.levels.cleanRange - 1] },
      { id: 'coinBonus', name: 'Coin Bonus', level: this.levels.coinBonus, maxLevel: 3, cost: this.costs.coinBonus[this.levels.coinBonus - 1], canBuy: this.levels.coinBonus < 3 && this.coins >= this.costs.coinBonus[this.levels.coinBonus - 1] }
    ];
    return items;
  }

  reset(keepUpgrades = true) {
    this.coins = 0;
    if (!keepUpgrades) {
      this.levels.cleanSpeed = 1;
      this.levels.cleanRange = 1;
      this.levels.coinBonus = 1;
    }
    this.notify();
    if (this.onValuesChanged) {
      this.onValuesChanged(this.getValues());
    }
  }

  private notify() {
    if (this.onUpdate) this.onUpdate();
  }
}
