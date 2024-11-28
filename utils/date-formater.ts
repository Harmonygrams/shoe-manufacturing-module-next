export function dateFormater(date: string) {
    try {
        const dateObject = new Date(date);
        const day = dateObject.getDate(); // Day of the month
        const month = dateObject.getMonth() + 1; // Months are zero-based
        const year = dateObject.getFullYear();
        
        // Ensure two-digit formatting for day and month
        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedMonth = month < 10 ? `0${month}` : month;

        return `${year}-${formattedMonth}-${formattedDay}`;
    } catch (err) {
        return '';
    }
}
