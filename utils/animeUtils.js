const formatRating = (rating) => {
    if(!rating) return "N/A";
    if (rating.startsWith("R - 17")) return "17+";
    if(rating.startsWith("R+") || rating.startsWith("Rx")) return "18+";
    return rating.split(" ")[0];
} 

const formatAiringStatus = (status) => {
    if (status === "Finished Airing") return "Completed";
}

const formatDuration = (duration) => {
    return duration.split(" ").splice(0,2).join(" ");
}

export { formatAiringStatus, formatDuration, formatRating };
