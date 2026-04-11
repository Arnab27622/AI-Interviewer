/**
 * Utility to push real-time updates to the frontend via Socket.io.
 * 
 * @param {Object} io - Socket.io server instance.
 * @param {string} userId - ID of the user to notify.
 * @param {string} sessionId - ID of the interview session.
 * @param {string} status - Descriptive status code (e.g., "AI_EVALUATING").
 * @param {string} message - Human-readable message for the UI.
 * @param {Object|null} session - Optional full session object for major state updates.
 */
export const pushSocketUpdate = (io, userId, sessionId, status, message, session = null) => {
    if (!io) {
        console.warn("Socket.io instance not found, update not pushed.");
        return;
    }
    
    io.to(userId.toString()).emit("sessionUpdate", {
        sessionId,
        status,
        message,
        session
    });
};
