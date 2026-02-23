export function validateSchedule(schedule) {
    const errors = [];

    if (!schedule.name || schedule.name.trim() === '') {
      errors.push('Schedule name is required');
    }

    if (!schedule.time) {
      errors.push('Time is required');
    }

    if (!schedule.days || schedule.days.length === 0) {
      errors.push('At least one day must be selected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  export function formatTime12Hour(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  export function getDeviceStatusText(device) {
    if (device.status === 'offline') {
      return 'Device is offline';
    }
    if (device.powerState === 'off') {
      return 'Device is powered off';
    }
    return `Cooling to ${device.targetTemp}°C`;
  }
