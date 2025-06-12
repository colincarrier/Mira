
import { storage } from "./storage";
import type { Todo } from "@shared/schema";

interface NotificationSchedule {
  todoId: number;
  title: string;
  scheduledTime: Date;
  type: 'immediate' | 'before' | 'recurring';
  leadTime?: string; // e.g., "15 minutes", "1 hour", "1 day"
}

class NotificationSystem {
  private scheduledNotifications: Map<number, NotificationSchedule[]> = new Map();
  private notificationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startNotificationChecker();
  }

  /**
   * Start the notification checking system
   */
  startNotificationChecker() {
    // Check for due notifications every minute
    this.notificationInterval = setInterval(async () => {
      await this.checkAndSendNotifications();
    }, 60000); // 60 seconds

    console.log("📬 Notification system started - checking every minute");
  }

  /**
   * Stop the notification system
   */
  stopNotificationChecker() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  /**
   * Schedule notifications for a todo/reminder
   */
  async scheduleNotifications(todo: Todo) {
    if (!todo.isActiveReminder || !todo.timeDue) {
      return; // Only schedule for active reminders with due times
    }

    const schedules: NotificationSchedule[] = [];
    const dueTime = new Date(todo.timeDue);
    const now = new Date();

    // Skip if due time is in the past
    if (dueTime <= now) {
      console.log(`⏰ Skipping notification for past due reminder: ${todo.title}`);
      return;
    }

    // Parse notification structure
    const notificationConfig = todo.plannedNotificationStructure;
    if (notificationConfig?.enabled && notificationConfig.leadTimeNotifications) {
      
      for (const leadTimeStr of notificationConfig.leadTimeNotifications) {
        const leadTimeMs = this.parseLeadTime(leadTimeStr);
        if (leadTimeMs > 0) {
          const notificationTime = new Date(dueTime.getTime() - leadTimeMs);
          
          // Only schedule if notification time is in the future
          if (notificationTime > now) {
            schedules.push({
              todoId: todo.id,
              title: todo.title,
              scheduledTime: notificationTime,
              type: 'before',
              leadTime: leadTimeStr
            });
          }
        }
      }
    }

    // Schedule notification at due time
    schedules.push({
      todoId: todo.id,
      title: todo.title,
      scheduledTime: dueTime,
      type: 'immediate'
    });

    this.scheduledNotifications.set(todo.id, schedules);
    
    console.log(`📅 Scheduled ${schedules.length} notifications for: ${todo.title}`);
    schedules.forEach(schedule => {
      console.log(`  - ${schedule.type}: ${schedule.scheduledTime.toLocaleString()}`);
    });
  }

  /**
   * Parse lead time string to milliseconds
   */
  private parseLeadTime(leadTimeStr: string): number {
    const patterns = [
      { regex: /(\d+)\s*minutes?\s*before/i, multiplier: 60 * 1000 },
      { regex: /(\d+)\s*hours?\s*before/i, multiplier: 60 * 60 * 1000 },
      { regex: /(\d+)\s*days?\s*before/i, multiplier: 24 * 60 * 60 * 1000 },
      { regex: /(\d+)\s*weeks?\s*before/i, multiplier: 7 * 24 * 60 * 60 * 1000 },
      { regex: /(\d+)\s*min/i, multiplier: 60 * 1000 },
      { regex: /(\d+)\s*hr/i, multiplier: 60 * 60 * 1000 }
    ];

    for (const pattern of patterns) {
      const match = leadTimeStr.match(pattern.regex);
      if (match) {
        const value = parseInt(match[1]);
        return value * pattern.multiplier;
      }
    }

    return 0; // Invalid format
  }

  /**
   * Check for due notifications and send them
   */
  private async checkAndSendNotifications() {
    const now = new Date();
    const notifications: NotificationSchedule[] = [];

    // Collect all due notifications
    for (const [todoId, schedules] of this.scheduledNotifications.entries()) {
      const dueNotifications = schedules.filter(schedule => 
        schedule.scheduledTime <= now
      );

      notifications.push(...dueNotifications);

      // Remove sent notifications from schedule
      if (dueNotifications.length > 0) {
        const remainingSchedules = schedules.filter(schedule => 
          schedule.scheduledTime > now
        );
        
        if (remainingSchedules.length > 0) {
          this.scheduledNotifications.set(todoId, remainingSchedules);
        } else {
          this.scheduledNotifications.delete(todoId);
        }
      }
    }

    // Send notifications
    for (const notification of notifications) {
      await this.sendNotification(notification);
    }

    if (notifications.length > 0) {
      console.log(`📬 Sent ${notifications.length} notifications`);
    }
  }

  /**
   * Send a notification (placeholder for various notification methods)
   */
  private async sendNotification(notification: NotificationSchedule) {
    console.log(`🔔 NOTIFICATION: ${notification.title}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Time: ${notification.scheduledTime.toLocaleString()}`);
    
    if (notification.leadTime) {
      console.log(`   Lead time: ${notification.leadTime}`);
    }

    // Here you would integrate with:
    // - Web Push API for browser notifications
    // - Service Worker for PWA notifications
    // - Email notifications
    // - SMS notifications
    // - WebSocket for real-time updates
    
    // For now, we'll update the todo with notification metadata
    try {
      await storage.updateTodo(notification.todoId, {
        lastNotificationSent: new Date(),
        nextNotificationDue: this.calculateNextNotification(notification)
      });
    } catch (error) {
      console.error("Error updating todo notification metadata:", error);
    }
  }

  /**
   * Calculate next notification time for recurring reminders
   */
  private calculateNextNotification(notification: NotificationSchedule): Date | undefined {
    const todo = storage.getTodos().then(todos => 
      todos.find(t => t.id === notification.todoId)
    );

    // TODO: Implement recurring notification logic based on repeatPattern
    return undefined;
  }

  /**
   * Refresh notifications by reloading all active reminders
   */
  async refreshNotifications() {
    console.log("🔄 Refreshing notification schedules...");
    
    // Clear existing schedules
    this.scheduledNotifications.clear();

    // Get all active reminders
    const todos = await storage.getTodos();
    console.log(`📋 Total todos fetched: ${todos.length}`);
    
    // Debug: Show first few todos with their reminder status
    todos.slice(0, 5).forEach(todo => {
      console.log(`🔍 Todo: "${todo.title}" - isActiveReminder: ${todo.isActiveReminder} (type: ${typeof todo.isActiveReminder}) - timeDue: ${todo.timeDue}`);
    });
    
    const activeReminders = todos.filter(todo => {
      const isActive = todo.isActiveReminder === true;
      const notCompleted = !todo.completed;
      const notArchived = !todo.archived;
      const hasDueTime = todo.timeDue != null;
      
      if (isActive) {
        console.log(`📝 Active reminder found: "${todo.title}" - Due: ${todo.timeDue} - Completed: ${todo.completed} - Archived: ${todo.archived}`);
      }
      
      return isActive && notCompleted && notArchived;
    });

    console.log(`📋 Found ${activeReminders.length} active reminders to schedule`);

    // Schedule notifications for each active reminder
    for (const reminder of activeReminders) {
      console.log(`📅 Scheduling notifications for: "${reminder.title}"`);
      await this.scheduleNotifications(reminder);
    }

    console.log(`📅 Total scheduled notification sets: ${this.scheduledNotifications.size}`);
  }

  /**
   * Get current notification status
   */
  getNotificationStatus() {
    const totalScheduled = Array.from(this.scheduledNotifications.values())
      .reduce((total, schedules) => total + schedules.length, 0);

    return {
      activeReminders: this.scheduledNotifications.size,
      totalScheduledNotifications: totalScheduled,
      nextNotification: this.getNextNotification()
    };
  }

  /**
   * Get the next upcoming notification
   */
  private getNextNotification(): NotificationSchedule | null {
    let earliest: NotificationSchedule | null = null;

    for (const schedules of this.scheduledNotifications.values()) {
      for (const schedule of schedules) {
        if (!earliest || schedule.scheduledTime < earliest.scheduledTime) {
          earliest = schedule;
        }
      }
    }

    return earliest;
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();

// Initialize on server start
export async function initializeNotificationSystem() {
  console.log("🚀 Initializing notification system...");
  await notificationSystem.refreshNotifications();
  
  const status = notificationSystem.getNotificationStatus();
  console.log("📊 Notification system status:", status);
  
  if (status.nextNotification) {
    console.log(`⏰ Next notification: "${status.nextNotification.title}" at ${status.nextNotification.scheduledTime.toLocaleString()}`);
  }
}
