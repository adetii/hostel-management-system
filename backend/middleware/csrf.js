const { getSession } = require('../utils/sessionService');
const { getCookieName } = require('../utils/sessionService');

function isSafeMethod(method) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method);
}

async function csrfProtect(req, res, next) {
  try {
    if (isSafeMethod(req.method)) return next();

    // Get tab-scoped session cookie
    const cookieName = getCookieName(req.tabId);
    const sessionId = req.cookies?.[cookieName];
    
    if (!sessionId) {
      return res.status(401).json({ message: 'No session for CSRF validation' });
    }
    
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Invalid session for CSRF validation' });
    }

    // Validate tab context if session has tab ID
    if (session.tabId && req.tabId && session.tabId !== req.tabId) {
      return res.status(401).json({ message: 'Invalid tab context for CSRF validation' });
    }

    const headerToken = req.header('X-CSRF-Token');
    if (!headerToken || headerToken !== session.csrfToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    
    next();
  } catch (e) {
    console.error('CSRF middleware error:', e);
    res.status(403).json({ message: 'CSRF validation failed' });
  }
}

module.exports = { csrfProtect };