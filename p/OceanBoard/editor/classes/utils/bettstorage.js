/**
 * OceanBoard Better Storage Functions
 * Wrapp around existing storage with compression and error handling
*/

import { storageCompression } from '../utils/storage.js';
import { errorHandler } from '../utils/errorhandler.js';
import { feedbackManager } from '../utils/feedback.js';

// Save file content with compression
export function saveFileContentCompressed(fileId, content) {
    return errorHandler.safe(() => {
        storageCompression.setItem('ob-file-' + fileId, content);
        console.log(`[Storage] Saved file: ${fileId} (${content.length} chars)`);
        return true;
    }, { type: 'storage' }, false);
}

// Load file content with decompression
export function loadFileContentCompressed(fileId) {
    return errorHandler.safe(() => {
        const content = storageCompression.getItem('ob-file-' + fileId);
        return content || '';
    }, { type: 'storage' }, '');
}

// Save series data with compression
export function saveSeriesDataCompressed(seriesId, data) {
    return errorHandler.safe(() => {
        storageCompression.setItem('ob-series-' + seriesId, data);
        console.log(`[Storage] Saved series: ${seriesId}`);
        return true;
    }, { type: 'storage' }, false);
}

// Load series data with decompression
export function loadSeriesDataCompressed(seriesId) {
    return errorHandler.safe(() => {
        const data = storageCompression.getItem('ob-series-' + seriesId);
        return data || null;
    }, { type: 'storage' }, null);
}

// Save settings with compression
export function saveSettingsCompressed(settings) {
    return errorHandler.safe(() => {
        storageCompression.setItem('ob-settings', settings);
        console.log(`[Storage] Saved settings`);
        return true;
    }, { type: 'storage' }, false);
}

// Load settings with decompression
export function loadSettingsCompressed() {
    return errorHandler.safe(() => {
        const settings = storageCompression.getItem('ob-settings');
        return settings || {};
    }, { type: 'storage' }, {});
}

// Migrate existing localStorage data to compressed format
export async function migrateToCompressedStorage() {
    console.log('[Storage] Starting migration to compressed storage...');
    
    try {
        let migratedCount = 0;
        let errorCount = 0;
        
        // Get all localStorage keys
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            keys.push(localStorage.key(i));
        }
        
        for (const key of keys) {
            try {
                if (key.startsWith('ob-file-') || key.startsWith('ob-series-') || key === 'ob-settings') {
                    const oldValue = localStorage.getItem(key);
                    if (oldValue) {
                        // Check if already in new format
                        try {
                            const parsed = JSON.parse(oldValue);
                            if (typeof parsed === 'object' && parsed.hasOwnProperty('compressed')) {
                                continue; // Already migrated
                            }
                        } catch {
                            // Not JSON, treat as raw string
                        }
                        
                        // Migrate to compressed format
                        const success = storageCompression.setItem(key, oldValue);
                        if (success) {
                            migratedCount++;
                        } else {
                            errorCount++;
                        }
                    }
                }
            } catch (error) {
                console.warn(`[Storage] Failed to migrate key: ${key}`, error);
                errorCount++;
            }
        }
        
        console.log(`[Storage] Migration complete: ${migratedCount} items migrated, ${errorCount} errors`);
        
        if (migratedCount > 0) {
            feedbackManager.showSuccess(`Migrated ${migratedCount} files to compressed storage`);
        }
        
        return { migratedCount, errorCount };
        
    } catch (error) {
        console.error('[Storage] Migration failed:', error);
        errorHandler.logError(error, false);
        return { migratedCount: 0, errorCount: 1 };
    }
}

// Get storage statistics
export function getStorageStats() {
    const compressionStats = storageCompression.getStats();
    const storageInfo = storageCompression.getStorageInfo();
    
    return {
        compression: compressionStats,
        usage: storageInfo
    };
}

// Clear all data (with confirmation)
export function clearAllData() {
    return errorHandler.safe(() => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            storageCompression.clear();
            feedbackManager.showSuccess('All data cleared');
            return true;
        }
        return false;
    }, { type: 'storage' }, false);
}

// Backup all data to JSON
export function createDataBackup() {
    return errorHandler.safe(() => {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {}
        };
        
        // Export all OceanBoard data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('ob-')) {
                backup.data[key] = storageCompression.getItem(key);
            }
        }
        
        return backup;
    }, { type: 'storage' }, null);
}

// Restore data from backup
export function restoreDataBackup(backup) {
    return errorHandler.safe(() => {
        if (!backup || !backup.data) {
            throw new Error('Invalid backup format');
        }
        
        let restoredCount = 0;
        
        Object.entries(backup.data).forEach(([key, value]) => {
            if (key.startsWith('ob-')) {
                storageCompression.setItem(key, value);
                restoredCount++;
            }
        });
        
        feedbackManager.showSuccess(`Restored ${restoredCount} items from backup`);
        return restoredCount;
    }, { type: 'storage' }, 0);
}

// Test storage performance
export function testStoragePerformance() {
    const testData = 'a'.repeat(10000); // 10KB test string
    const iterations = 100;
    
    console.log('[Storage] Testing storage performance...');
    
    // Test regular localStorage
    const regularStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        localStorage.setItem(`test-regular-${i}`, testData);
        localStorage.getItem(`test-regular-${i}`);
    }
    const regularTime = performance.now() - regularStart;
    
    // Test compressed storage
    const compressedStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        storageCompression.setItem(`test-compressed-${i}`, testData);
        storageCompression.getItem(`test-compressed-${i}`);
    }
    const compressedTime = performance.now() - compressedStart;
    
    // Clean up test data
    for (let i = 0; i < iterations; i++) {
        localStorage.removeItem(`test-regular-${i}`);
        storageCompression.removeItem(`test-compressed-${i}`);
    }
    
    const results = {
        regularTime: Math.round(regularTime),
        compressedTime: Math.round(compressedTime),
        difference: Math.round(compressedTime - regularTime),
        compression: storageCompression.testCompression(testData)
    };
    
    console.log('[Storage] Performance test results:', results);
    return results;
}