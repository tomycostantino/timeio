const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0"),
    ].join(":");
};

const formatApplicationTime = (seconds) => {
    if (seconds === 0) return "0 seconds";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) {
        parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }
    if (secs > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
    }

    return parts.join(" ");
};

const formatDate = (seconds) => {
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
}

module.exports = {
    formatElapsedTime,
    formatApplicationTime,
    formatDate,
}
