import path from 'path';

export function cleanAndFormatUrl(url, req) {
  if (!url) return url;

  // Leave external/Unsplash URLs intact
  if (url.startsWith('http') && !url.includes('/uploads/')) {
    return url;
  }

  // Extract filename from path or URL
  let filename = '';
  if (url.includes('/uploads/')) {
    filename = url.split('/uploads/').pop();
  } else if (url.includes('\\uploads\\')) {
    filename = url.split('\\uploads\\').pop();
  } else {
    filename = path.basename(url);
  }

  // Clean up query parameters if any
  filename = filename.split('?')[0];

  // Construct correct absolute URL based on the incoming request
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/${filename}`;
}

function normalizePayload(obj, req) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => normalizePayload(item, req));
  }

  if (typeof obj === 'object') {
    let target = obj;
    if (typeof obj.toJSON === 'function') {
      try {
        target = obj.toJSON();
      } catch (e) {}
    } else if (typeof obj.toObject === 'function') {
      try {
        target = obj.toObject();
      } catch (e) {}
    }

    if (target === null || target === undefined || typeof target !== 'object') {
      return target;
    }

    const newObj = {};
    for (const key of Object.keys(target)) {
      if (key === 'receiptUrl' && typeof target[key] === 'string') {
        newObj[key] = cleanAndFormatUrl(target[key], req);
      } else {
        newObj[key] = normalizePayload(target[key], req);
      }
    }
    return newObj;
  }

  return obj;
}

export const responseUrlNormalizer = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    if (body) {
      body = normalizePayload(body, req);
    }
    return originalJson.call(this, body);
  };

  next();
};
