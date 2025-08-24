const { Settings } = require('../models');
const cron = require('node-cron');

class PortalScheduler {
  constructor(io) {
    this.io = io;
    this.init();
  }

  init() {
    // Check every minute for portal status changes
    cron.schedule('* * * * *', async () => {
      await this.checkAndUpdatePortalStatus();
    });

    console.log('Portal scheduler initialized - checking every minute');
  }

  async checkAndUpdatePortalStatus() {
    try {
      const settings = await Settings.findOne();
      if (!settings) return;

      const now = new Date();
      const openTime = settings.bookingPortalOpenDateTime ? new Date(settings.bookingPortalOpenDateTime) : null;
      const closeTime = settings.bookingPortalCloseDateTime ? new Date(settings.bookingPortalCloseDateTime) : null;
      
      let shouldBeEnabled = settings.bookingPortalEnabled; // Keep current state as default
      let shouldResetDates = false;
      let statusChanged = false;

      // Handle future scheduling logic
      if (openTime && closeTime) {
        // Case 1: Before open time - portal should be disabled
        if (now < openTime) {
          shouldBeEnabled = false;
        }
        // Case 2: Between open and close time - portal should be enabled
        else if (now >= openTime && now <= closeTime) {
          shouldBeEnabled = true;
          // Mark that we just opened if we weren't enabled before
          if (!settings.bookingPortalEnabled) {
            statusChanged = true;
          }
        }
        // Case 3: After close time - portal should be disabled and dates reset
        else if (now > closeTime) {
          shouldBeEnabled = false;
          shouldResetDates = true; // <-- only clear after close is due
        }
      }
      // Handle case where only open time is set (future activation)
      else if (openTime && !closeTime) {
        // If we've reached the open time, enable the portal
        if (now >= openTime && !settings.bookingPortalEnabled) {
          shouldBeEnabled = true;
          statusChanged = true;
          // NOTE: do NOT reset dates here; clear only after close time is due
        }
      }

      // Update if status has changed or if we need to reset dates
      if (settings.bookingPortalEnabled !== shouldBeEnabled || shouldResetDates) {
        const updateData = { bookingPortalEnabled: shouldBeEnabled };
        
        // Reset datetime fields only when close time is due
        if (shouldResetDates) {
          updateData.bookingPortalOpenDateTime = null;
          updateData.bookingPortalCloseDateTime = null;
        }
        
        settings.set(updateData);
        await settings.save();
        
        if (statusChanged) {
          console.log(`Portal automatically ${shouldBeEnabled ? 'enabled' : 'disabled'} at ${now.toISOString()}`);
        }
        if (shouldResetDates) {
          console.log('Portal schedule dates reset to null');
        }
        
        // Emit real-time update to all connected clients
        if (this.io) {
          this.io.emit('portal-status-changed', {
            enabled: shouldBeEnabled,
            timestamp: now.toISOString(),
            reason: shouldBeEnabled ? 'scheduled_open' : 'scheduled_close',
            datesReset: shouldResetDates,
            futureActivation: openTime && !closeTime,
            // Only include date fields if they were actually reset
            ...(shouldResetDates && {
              bookingPortalOpenDateTime: null,
              bookingPortalCloseDateTime: null
            }),
            // Always include the portal status
            bookingPortalEnabled: shouldBeEnabled
          });
          
          // Also emit settings-updated for real-time UI updates
          // Only send full settings when dates are reset or it's a manual update
          if (shouldResetDates) {
            this.io.emit('settings-updated', {
              bookingPortalEnabled: shouldBeEnabled,
              bookingPortalOpenDateTime: null,
              bookingPortalCloseDateTime: null,
              datesReset: true
            });
          } else {
            // For status-only changes, only send the status
            this.io.emit('settings-updated', {
              bookingPortalEnabled: shouldBeEnabled,
              statusOnly: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Portal scheduler error:', error);
    }
  }

  // Update the getNextStatusChange method
  async getNextStatusChange() {
    try {
      const settings = await Settings.findOne();
      if (!settings) return null;

      const now = new Date();
      const openTime = settings.bookingPortalOpenDateTime ? new Date(settings.bookingPortalOpenDateTime) : null;
      const closeTime = settings.bookingPortalCloseDateTime ? new Date(settings.bookingPortalCloseDateTime) : null;

      // Future activation (only open time set)
      if (openTime && !closeTime && now < openTime) {
        return {
          nextAction: 'activate',
          nextTime: openTime,
          timeUntil: openTime.getTime() - now.getTime()
        };
      }

      // Standard open-close schedule
      if (openTime && closeTime) {
        if (now < openTime) {
          return {
            nextAction: 'open',
            nextTime: openTime,
            timeUntil: openTime.getTime() - now.getTime()
          };
        } else if (now >= openTime && now < closeTime) {
          return {
            nextAction: 'close',
            nextTime: closeTime,
            timeUntil: closeTime.getTime() - now.getTime()
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting next status change:', error);
      return null;
    }
  }
}

module.exports = PortalScheduler;