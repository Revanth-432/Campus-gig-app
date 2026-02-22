export const checkAvailabilityMatch = (
    taskDate: string | Date | undefined | null,
    taskTime: string | Date | undefined | null,
    userAvailability: number[][] | undefined | null
): boolean => {
    // If availability is empty/null, show all tasks by default
    if (!userAvailability || !Array.isArray(userAvailability) || userAvailability.length === 0) {
        return true;
    }

    // If task lacks explicit date/time edge cases, default to showing the task
    if (!taskDate || !taskTime) {
        return true;
    }

    try {
        const dateObj = new Date(taskDate);
        if (isNaN(dateObj.getTime())) return true;

        // JS getDay(): 0 is Sunday, 1 is Monday.
        // Heatmap expects 0 for Monday to 6 for Sunday.
        let dayOfWeek = dateObj.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6;

        let hours = 0;
        if (taskTime instanceof Date) {
            hours = taskTime.getHours();
        } else if (typeof taskTime === 'string') {
            const timeParts = taskTime.split(':');
            // Check if standard "HH:mm" time string or ISO
            if (taskTime.includes('T')) {
                const parsedDate = new Date(taskTime);
                if (!isNaN(parsedDate.getTime())) {
                    hours = parsedDate.getHours();
                }
            } else if (timeParts.length > 0) {
                hours = parseInt(timeParts[0], 10);
            }
        } else {
            return true;
        }

        // "Morning" (00:00 - 11:59) -> slot 0
        // "Afternoon" (12:00 - 16:59) -> slot 1
        // "Evening" (17:00 - 23:59) -> slot 2
        let timeOfDay = 0;
        if (hours >= 12 && hours < 17) {
            timeOfDay = 1;
        } else if (hours >= 17) {
            timeOfDay = 2;
        }

        // The userAvailability is a 7x3 grid where 0 = Busy, 1 = Flexible, 2 = Free
        if (userAvailability[dayOfWeek] && userAvailability[dayOfWeek][timeOfDay] !== undefined) {
            const status = userAvailability[dayOfWeek][timeOfDay];
            // Only show tasks if the user is not busy (Flexible or Free)
            if (status === 0) {
                return false;
            }
        }

        return true;
    } catch (e) {
        return true;
    }
};
