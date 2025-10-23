import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BackupManager {
  private backupDir: string;
  private dbPath: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a backup of the database
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFileName);

      // Copy the SQLite database file
      await fs.promises.copyFile(this.dbPath, backupPath);

      console.log(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * List all available backups
   */
  listBackups(): string[] {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFileName: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      // Create a backup of current database before restoring
      const currentBackupName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      const currentBackupPath = path.join(this.backupDir, currentBackupName);
      await fs.promises.copyFile(this.dbPath, currentBackupPath);

      // Restore from backup
      await fs.promises.copyFile(backupPath, this.dbPath);

      console.log(`Database restored from: ${backupFileName}`);
      console.log(`Previous state backed up as: ${currentBackupName}`);
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups (keep only the most recent N backups)
   */
  async cleanupOldBackups(keepCount: number = 10): Promise<void> {
    try {
      const backups = this.listBackups();

      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);

        for (const backup of toDelete) {
          const backupPath = path.join(this.backupDir, backup);
          await fs.promises.unlink(backupPath);
          console.log(`Deleted old backup: ${backup}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Get backup information
   */
  getBackupInfo(): { totalBackups: number; latestBackup: string | null; totalSize: number } {
    try {
      const backups = this.listBackups();
      let totalSize = 0;

      for (const backup of backups) {
        const stats = fs.statSync(path.join(this.backupDir, backup));
        totalSize += stats.size;
      }

      return {
        totalBackups: backups.length,
        latestBackup: backups.length > 0 ? backups[0] : null,
        totalSize
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return { totalBackups: 0, latestBackup: null, totalSize: 0 };
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleAutomaticBackup(intervalHours: number = 24): void {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('Error in scheduled backup:', error);
      }
    }, intervalMs);

    console.log(`Automatic backup scheduled every ${intervalHours} hours`);
  }
}

// Export singleton instance
export const backupManager = new BackupManager();
