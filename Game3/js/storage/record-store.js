import { DatabaseManager } from './db.js';

export class RecordStore {
  constructor() {
    this.db = new DatabaseManager();
    this.storeName = 'gameRecords';
  }

  async init() {
    await this.db.open();
  }

  generateId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  async saveGame(gameData) {
    const data = { ...gameData };
    if (!data.id) {
      data.id = this.generateId();
    }
    if (!data.date) {
      data.date = new Date().toISOString();
    }
    await this.db.add(this.storeName, data);
    return data.id;
  }

  async getAllGames() {
    const games = await this.db.getAll(this.storeName);
    games.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    return games;
  }

  async getGame(id) {
    return this.db.getById(this.storeName, id);
  }

  async deleteGame(id) {
    await this.db.deleteById(this.storeName, id);
  }
}
