/**
 * RFC 5322 Email Header & Hop Route Parser
 */

export function parseRawHeaders(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { headers: {}, keyList: [], rawHops: [], parsedHops: [] };
  }

  // 1. Unfold multiline headers (RFC 5322: line starting with space or tab is continuation)
  const unfoldedLines = [];
  const rawLines = rawText.replace(/\r\n/g, '\n').split('\n');

  for (let line of rawLines) {
    if (/^[ \t]/.test(line) && unfoldedLines.length > 0) {
      // Append continuation line to previous line
      unfoldedLines[unfoldedLines.length - 1] += ' ' + line.trim();
    } else {
      unfoldedLines.push(line);
    }
  }

  // 2. Parse key-value pairs
  const headers = {};
  const keyList = [];
  const rawHops = [];

  for (let line of unfoldedLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      const lowerKey = key.toLowerCase();

      if (!headers[lowerKey]) {
        headers[lowerKey] = [];
      }
      headers[lowerKey].push(value);
      keyList.push({ key, value });

      if (lowerKey === 'received') {
        rawHops.push(value);
      }
    }
  }

  // 3. Process Received Hops in chronological order (First hop to Last hop)
  // Headers typically order top-to-bottom as Latest-to-Earliest, so we reverse rawHops.
  const chronologicalHops = [...rawHops].reverse();
  const parsedHops = parseHopSequence(chronologicalHops);

  // 4. Extract clean specific fields
  const extracted = {
    from: getSingleHeader(headers, 'from'),
    to: getSingleHeader(headers, 'to'),
    subject: getSingleHeader(headers, 'subject'),
    date: getSingleHeader(headers, 'date'),
    messageId: getSingleHeader(headers, 'message-id'),
    returnPath: getSingleHeader(headers, 'return-path'),
    replyTo: getSingleHeader(headers, 'reply-to'),
    xMailer: getSingleHeader(headers, 'x-mailer') || getSingleHeader(headers, 'user-agent') || getSingleHeader(headers, 'x-mailer-type'),
    xOriginatingIp: getSingleHeader(headers, 'x-originating-ip') || getSingleHeader(headers, 'x-sender-ip'),
    receivedSpf: getSingleHeader(headers, 'received-spf'),
    authResults: getAllHeaderValues(headers, 'authentication-results'),
    dkimSignature: getSingleHeader(headers, 'dkim-signature'),
    contentType: getSingleHeader(headers, 'content-type'),
    deliveredTo: getSingleHeader(headers, 'delivered-to')
  };

  // Extract display name and email address details
  extracted.fromParsed = parseEmailAddress(extracted.from);
  extracted.toParsed = parseEmailAddress(extracted.to);
  extracted.replyToParsed = parseEmailAddress(extracted.replyTo);
  extracted.returnPathParsed = parseEmailAddress(extracted.returnPath);

  return {
    rawText,
    headers,
    keyList,
    extracted,
    hops: parsedHops
  };
}

function getSingleHeader(headersObj, key) {
  const arr = headersObj[key.toLowerCase()];
  return (arr && arr.length > 0) ? arr[0] : '';
}

function getAllHeaderValues(headersObj, key) {
  const arr = headersObj[key.toLowerCase()];
  return arr || [];
}

/**
 * Extracts Display Name and Email Address from header strings like:
 * "John Doe" <john@example.com> or john@example.com
 */
export function parseEmailAddress(str) {
  if (!str) return { displayName: '', email: '', domain: '' };
  
  let displayName = '';
  let email = '';

  const match = str.match(/^(?:"?([^"]*)"?\s)?<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?$/);
  if (match) {
    displayName = (match[1] || '').trim();
    email = (match[2] || '').trim();
  } else {
    // Fallback regex scan for email
    const emailMatch = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      email = emailMatch[1];
      displayName = str.replace(emailMatch[0], '').replace(/[<>"'\s]/g, '').trim();
    } else {
      email = str.trim();
    }
  }

  const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  return { displayName, email, domain };
}

/**
 * Parses received header strings into structured Hop objects with time latency calculation.
 */
function parseHopSequence(hopStrings) {
  const parsedHops = [];
  let previousDate = null;

  hopStrings.forEach((hopStr, index) => {
    // Extract "from" server/ip
    let fromHost = 'Unknown';
    let fromIp = '';
    const fromMatch = hopStr.match(/from\s+([^\s]+)(?:\s+\(([^)]+)\))?/i);
    if (fromMatch) {
      fromHost = fromMatch[1];
      if (fromMatch[2]) {
        const ipInParen = fromMatch[2].match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (ipInParen) fromIp = ipInParen[1];
      }
    }
    if (!fromIp) {
      const genericIp = hopStr.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
      if (genericIp) fromIp = genericIp[1];
    }

    // Extract "by" server
    let byHost = 'Unknown';
    const byMatch = hopStr.match(/by\s+([^\s]+)/i);
    if (byMatch) {
      byHost = byMatch[1];
    }

    // Extract protocol / with
    let protocol = 'SMTP';
    const withMatch = hopStr.match(/with\s+([^\s;]+)/i);
    if (withMatch) {
      protocol = withMatch[1];
    }

    // Extract date
    let hopDate = null;
    let dateStr = '';
    const dateSemicolonIdx = hopStr.lastIndexOf(';');
    if (dateSemicolonIdx !== -1) {
      dateStr = hopStr.substring(dateSemicolonIdx + 1).trim();
      const parsedTime = Date.parse(dateStr);
      if (!isNaN(parsedTime)) {
        hopDate = new Date(parsedTime);
      }
    }

    // Calculate delay in seconds from previous hop
    let delaySec = 0;
    if (hopDate && previousDate) {
      const diffMs = hopDate.getTime() - previousDate.getTime();
      delaySec = Math.max(0, Math.floor(diffMs / 1000));
    }

    if (hopDate) {
      previousDate = hopDate;
    }

    // IP classification (Private vs Public)
    const isPrivateIp = fromIp ? isPrivateIPAddress(fromIp) : false;

    parsedHops.push({
      hopNumber: index + 1,
      fromHost,
      fromIp,
      byHost,
      protocol,
      dateStr,
      timestamp: hopDate ? hopDate.toISOString() : null,
      delaySec,
      isPrivateIp,
      raw: hopStr
    });
  });

  return parsedHops;
}

/**
 * Checks if an IP is a private/internal RFC 1918 or loopback address.
 */
function isPrivateIPAddress(ip) {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;

  // 10.0.0.0 – 10.255.255.255
  if (parts[0] === 10) return true;
  // 172.16.0.0 – 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0 – 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}
