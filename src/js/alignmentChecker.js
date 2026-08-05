/**
 * SPF, DKIM, and DMARC Protocol & Alignment Verification Engine
 */

export function evaluateAuthenticationAndAlignment(parsedData) {
  const { extracted } = parsedData;

  const headerFromDomain = extracted.fromParsed?.domain || '';
  const returnPathDomain = extracted.returnPathParsed?.domain || '';

  // 1. Evaluate SPF
  const spfResult = parseSpfStatus(extracted.receivedSpf, extracted.authResults);
  const isSpfAligned = checkDomainAlignment(headerFromDomain, returnPathDomain);

  // 2. Evaluate DKIM
  const dkimDetails = parseDkimDetails(extracted.dkimSignature, extracted.authResults);
  const isDkimAligned = checkDomainAlignment(headerFromDomain, dkimDetails.domain);

  // 3. Evaluate DMARC
  const dmarcDetails = parseDmarcDetails(extracted.authResults);
  
  // DMARC passes if EITHER (SPF is PASS and SPF is ALIGNED) OR (DKIM is PASS and DKIM is ALIGNED)
  const dmarcCalculatedVerdict = (
    (spfResult.status.toLowerCase() === 'pass' && isSpfAligned) ||
    (dkimDetails.status.toLowerCase() === 'pass' && isDkimAligned)
  ) ? 'PASS' : 'FAIL';

  return {
    headerFromDomain,
    returnPathDomain,

    spf: {
      status: spfResult.status.toUpperCase(),
      clientIp: spfResult.clientIp,
      envelopeFrom: spfResult.envelopeFrom,
      isAligned: isSpfAligned,
      alignmentReason: isSpfAligned
        ? `Header From (${headerFromDomain}) aligns with Return-Path (${returnPathDomain})`
        : `Domain Mismatch: Header From (${headerFromDomain}) vs Return-Path (${returnPathDomain || 'None'})`
    },

    dkim: {
      status: dkimDetails.status.toUpperCase(),
      domain: dkimDetails.domain,
      selector: dkimDetails.selector,
      algorithm: dkimDetails.algorithm,
      isAligned: isDkimAligned,
      alignmentReason: isDkimAligned
        ? `Header From (${headerFromDomain}) aligns with DKIM domain (${dkimDetails.domain})`
        : `Domain Mismatch: Header From (${headerFromDomain}) vs DKIM domain (${dkimDetails.domain || 'None'})`
    },

    dmarc: {
      declaredStatus: dmarcDetails.status.toUpperCase(),
      calculatedVerdict: dmarcCalculatedVerdict,
      policy: dmarcDetails.policy.toUpperCase() || 'NONE',
      disposition: dmarcDetails.disposition,
      isFullyAuthenticated: dmarcCalculatedVerdict === 'PASS'
    }
  };
}

function parseSpfStatus(spfHeader, authResultsList) {
  let status = 'NONE';
  let clientIp = '';
  let envelopeFrom = '';

  if (spfHeader) {
    const statusMatch = spfHeader.match(/^(pass|fail|softfail|neutral|none)/i);
    if (statusMatch) status = statusMatch[1];

    const ipMatch = spfHeader.match(/client-ip=([\d.]+)/i);
    if (ipMatch) clientIp = ipMatch[1];

    const envMatch = spfHeader.match(/envelope-from=([^\s;]+)/i) || spfHeader.match(/domain of ([^\s]+)/i);
    if (envMatch) envelopeFrom = envMatch[1];
  }

  // Check auth-results if spfHeader wasn't definitive
  if (status === 'NONE' && authResultsList.length > 0) {
    for (let authRes of authResultsList) {
      const match = authRes.match(/spf=(pass|fail|softfail|neutral|none)/i);
      if (match) {
        status = match[1];
        break;
      }
    }
  }

  return { status, clientIp, envelopeFrom };
}

function parseDkimDetails(dkimHeader, authResultsList) {
  let status = 'NONE';
  let domain = '';
  let selector = '';
  let algorithm = '';

  if (dkimHeader) {
    status = 'PRESENT'; // Signature exists
    const dMatch = dkimHeader.match(/d=([^\s;]+)/i);
    if (dMatch) domain = dMatch[1];

    const sMatch = dkimHeader.match(/s=([^\s;]+)/i);
    if (sMatch) selector = sMatch[1];

    const aMatch = dkimHeader.match(/a=([^\s;]+)/i);
    if (aMatch) algorithm = aMatch[1];
  }

  // Look for status in Authentication-Results
  if (authResultsList.length > 0) {
    for (let authRes of authResultsList) {
      const match = authRes.match(/dkim=(pass|fail|none|neutral)/i);
      if (match) {
        status = match[1];
        const headerDMatch = authRes.match(/header\.d=([^\s;]+)/i);
        if (headerDMatch && !domain) domain = headerDMatch[1];
        break;
      }
    }
  }

  return { status, domain, selector, algorithm };
}

function parseDmarcDetails(authResultsList) {
  let status = 'NONE';
  let policy = 'NONE';
  let disposition = 'NONE';

  if (authResultsList.length > 0) {
    for (let authRes of authResultsList) {
      const match = authRes.match(/dmarc=(pass|fail|none)/i);
      if (match) {
        status = match[1];
        const pMatch = authRes.match(/p=(none|quarantine|reject)/i);
        if (pMatch) policy = pMatch[1];

        const disMatch = authRes.match(/dis=(none|quarantine|reject)/i);
        if (disMatch) disposition = disMatch[1];
        break;
      }
    }
  }

  return { status, policy, disposition };
}

/**
 * Validates domain alignment (relaxed DMARC alignment rule: exact match or subdomain match)
 */
export function checkDomainAlignment(domainA, domainB) {
  if (!domainA || !domainB) return false;
  const a = domainA.toLowerCase();
  const b = domainB.toLowerCase();
  if (a === b) return true;
  if (a.endsWith('.' + b) || b.endsWith('.' + a)) return true;
  return false;
}
