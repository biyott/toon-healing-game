import type { Shop } from '../shop/Shop.js';

export class UIManager {
  root: HTMLElement;
  coinEl: HTMLElement;
  progressBar: HTMLElement;
  progressText: HTMLElement;
  shopPanel: HTMLElement;
  shopToggle: HTMLButtonElement;
  clearOverlay: HTMLElement | null = null;
  floatingTexts: HTMLElement[] = [];

  constructor(
    root: HTMLElement,
    private shop: Shop,
    private onRestart: () => void
  ) {
    this.root = root;
    this.root.innerHTML = '';

    const hud = document.createElement('div');
    hud.className = 'hud';

    const topBar = document.createElement('div');
    topBar.className = 'hud-top';

    this.coinEl = document.createElement('div');
    this.coinEl.className = 'coin-badge';
    this.coinEl.textContent = '🪙 0';

    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap';
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'progress-bar';
    this.progressText = document.createElement('div');
    this.progressText.className = 'progress-text';
    this.progressText.textContent = '0%';
    progressWrap.append(this.progressBar, this.progressText);

    this.shopToggle = document.createElement('button');
    this.shopToggle.className = 'shop-toggle';
    this.shopToggle.textContent = '🛒 Shop';
    this.shopToggle.onclick = () => this.toggleShop();

    topBar.append(this.coinEl, progressWrap, this.shopToggle);
    hud.append(topBar);
    this.root.append(hud);

    this.shopPanel = this.createShopPanel();
    this.root.append(this.shopPanel);

    this.shop.onUpdate = () => this.renderShop();
    this.renderShop();
  }

  setCoins(coins: number) {
    this.coinEl.textContent = `🪙 ${coins}`;
  }

  setProgress(pct: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    this.progressBar.style.width = `${clamped}%`;
    this.progressText.textContent = `${clamped}%`;
  }

  toggleShop() {
    const open = this.shopPanel.classList.toggle('open');
    this.shopToggle.textContent = open ? '❌ Close' : '🛒 Shop';
  }

  private createShopPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'shop-panel';
    const title = document.createElement('h2');
    title.textContent = 'Upgrade Shop';
    panel.append(title);
    return panel;
  }

  private renderShop() {
    const existing = this.shopPanel.querySelectorAll('.shop-item');
    existing.forEach((el) => el.remove());

    const items = this.shop.getItems();
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'shop-item';

      const info = document.createElement('div');
      info.className = 'shop-info';
      const name = document.createElement('div');
      name.className = 'shop-name';
      name.textContent = item.name;
      const level = document.createElement('div');
      level.className = 'shop-level';
      level.textContent = `Lv.${item.level}/${item.maxLevel}`;
      info.append(name, level);

      const btn = document.createElement('button');
      btn.className = 'shop-buy';
      btn.textContent = item.canBuy ? `🪙 ${item.cost}` : 'MAX';
      btn.disabled = !item.canBuy;
      btn.onclick = () => {
        this.shop.buy(item.id);
      };

      row.append(info, btn);
      this.shopPanel.append(row);
    }
  }

  spawnFloatingText(text: string, x: number, y: number, color = '#fbbf24') {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    this.root.append(el);
    this.floatingTexts.push(el);

    requestAnimationFrame(() => {
      el.classList.add('float-up');
    });

    setTimeout(() => {
      el.remove();
      const idx = this.floatingTexts.indexOf(el);
      if (idx >= 0) this.floatingTexts.splice(idx, 1);
    }, 900);
  }

  showClearOverlay(coinsEarned: number) {
    if (this.clearOverlay) return;
    const overlay = document.createElement('div');
    overlay.className = 'clear-overlay';
    overlay.innerHTML = `
      <div class="clear-card">
        <h1>Stage Clear! ✨</h1>
        <p>Coins earned this run: 🪙 ${coinsEarned}</p>
        <button class="restart-btn">Play Again</button>
      </div>
    `;
    overlay.querySelector('.restart-btn')?.addEventListener('click', () => {
      overlay.remove();
      this.clearOverlay = null;
      this.onRestart();
    });
    this.root.append(overlay);
    this.clearOverlay = overlay;
  }
}
