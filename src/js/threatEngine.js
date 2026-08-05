/**
 * Threat Intelligence & Anomaly Scoring Engine
 */

export function calculateRiskScore(parsedData, authResult) {
  const findings = [];
  let score = 0;

  const { extracted, hops } = parsedData;
  const fromEmail = extracted.fromParsed?.email || '';
  const fromDomain = extracted.fromParsed?.domain || '';
  const fromName = extracted.fromParsed?.displayName || '';
  const replyToDomain = extracted.replyToParsed?.domain || '';
  const returnPathDomain = extracted.returnPathParsed?.domain || '';
  const mailer = extracted.xMailer || '';

  // 1. DMARC & Authentication Failures
  if (authResult.dmarc.calculatedVerdict === 'FAIL') {
    score += 30;
    findings.push({
      severity: 'CRITICAL',
      weight: 30,
      title: 'DMARC Authentication Failed',
      description: `The email failed DMARC validation. Policy is set to '${authResult.dmarc.policy}'. The email is unauthenticated or spoofed.`
    });
  }

  // 2. SPF Domain Alignment
  if (!authResult.spf.isAligned && fromDomain && returnPathDomain) {
    score += 20;
    findings.push({
      severity: 'HIGH',
      weight: 20,
      title: 'SPF Domain Mismatch (Envelope Spoofing)',
      description: `Header 'From' domain (${fromDomain}) does not align with 'Return-Path' bounce domain (${returnPathDomain}).`
    });
  }

  // 3. DKIM Domain Alignment
  if (!authResult.dkim.isAligned && fromDomain && authResult.dkim.domain) {
    score += 15;
    findings.push({
      severity: 'HIGH',
      weight: 15,
      title: 'DKIM Signature Domain Mismatch',
      description: `Header 'From' domain (${fromDomain}) does not match DKIM signing domain '${authResult.dkim.domain}'.`
    });
  }

  // 4. Reply-To Domain Mismatch
  if (replyToDomain && fromDomain && replyToDomain !== fromDomain) {
    score += 25;
    findings.push({
      severity: 'CRITICAL',
      weight: 25,
      title: 'Suspicious Reply-To Redirect',
      description: `Replies will be sent to '${replyToDomain}', which is different from the claimed sender domain '${fromDomain}'. Common BEC phishing indicator.`
    });
  }

  // 5. Display Name Impersonation / CEO Spoofing
  const suspiciousKeywords = ['CEO', 'CFO', 'EXECUTIVE', 'PAYPAL', 'MICROSOFT', 'GOOGLE', 'SUPPORT', 'SECURITY', 'ADMIN', 'BANK', 'INVOICE'];
  const nameUpper = fromName.toUpperCase();
  const matchedKeyword = suspiciousKeywords.find(kw => nameUpper.includes(kw));

  if (matchedKeyword && fromDomain) {
    const isStandardDomain = fromDomain.includes('paypal.com') || fromDomain.includes('microsoft.com') || fromDomain.includes('google.com');
    if (!isStandardDomain) {
      score += 25;
      findings.push({
        severity: 'CRITICAL',
        weight: 25,
        title: `Display Name Impersonation Risk ('${matchedKeyword}')`,
        description: `Display name '${fromName}' claims to be '${matchedKeyword}', but sender email is hosted on external domain '${fromDomain}'.`
      });
    }
  }

  // 6. Typosquatting / Lookalike Domain Detection
  const typosquatRegex = /(paypa[1l]|micros[0o]ft|g[0o][0o]gle|a[p0]ple|[a-z0-9]-security-[a-z]+|fast-invoicing)/i;
  if (fromDomain && typosquatRegex.test(fromDomain) && !['paypal.com', 'microsoft.com', 'google.com', 'apple.com'].includes(fromDomain)) {
    score += 20;
    findings.push({
      severity: 'HIGH',
      weight: 20,
      title: 'Possible Typosquatting / Lookalike Domain',
      description: `Sender domain '${fromDomain}' contains numbers or patterns mimicking legitimate brand domains.`
    });
  }

  // 7. Suspicious Mailer / Phishing Kit User-Agent
  if (mailer) {
    const suspiciousMailers = ['PHPMailer', 'GoPhish', 'Python', 'smtplib', 'MassMail', 'eMail-Sender'];
    const foundMailer = suspiciousMailers.find(m => mailer.toLowerCase().includes(m.toLowerCase()));
    if (foundMailer) {
      score += 15;
      findings.push({
        severity: 'MEDIUM',
        weight: 15,
        title: `Automated Script Mailer Detected (${foundMailer})`,
        description: `Email was dispatched using '${mailer}', commonly utilized by phishing frameworks, web forms, or mass mailers.`
      });
    }
  }

  // 8. Server Relay Hop Delay (> 10 Minutes)
  const delayedHop = hops.find(h => h.delaySec > 600);
  if (delayedHop) {
    const delayMins = Math.round(delayedHop.delaySec / 60);
    score += 10;
    findings.push({
      severity: 'MEDIUM',
      weight: 10,
      title: `Significant Relay Hop Delay (${delayMins} min)`,
      description: `Hop #${delayedHop.hopNumber} (${delayedHop.byHost}) experienced a ${delayMins}-minute delay. May indicate queue holding, grey listing, or relay manipulation.`
    });
  }

  // 9. Internal RFC 1918 IP Exposure
  const internalIpHop = hops.find(h => h.isPrivateIp);
  if (internalIpHop) {
    findings.push({
      severity: 'INFORMATIONAL',
      weight: 0,
      title: `Internal Network IP Exposed (${internalIpHop.fromIp})`,
      description: `Hop #${internalIpHop.hopNumber} contains private RFC1918 IP address '${internalIpHop.fromIp}'. Discloses internal mail server architecture.`
    });
  }

  // Normalize score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Overall Risk Rating
  let riskLevel = 'LOW';
  let riskBadgeColor = 'var(--color-success)';
  let verdictTitle = 'Legitimate & Fully Authenticated Email';
  let analystGuidance = 'All email authentication checks passed. Header attributes align with expected domain policies.';

  if (finalScore >= 75) {
    riskLevel = 'CRITICAL';
    riskBadgeColor = 'var(--color-danger)';
    verdictTitle = 'CRITICAL THREAT: High-Probability BEC / Spoofed Phishing';
    analystGuidance = 'IMMEDIATE ACTION RECOMMENDED: Block sender domain on email gateway, delete email from user inbox, and initiate credential reset if links/attachments were interacted with.';
  } else if (finalScore >= 45) {
    riskLevel = 'HIGH';
    riskBadgeColor = 'var(--color-warning-high)';
    verdictTitle = 'HIGH RISK: Unauthenticated or Impersonation Attempt';
    analystGuidance = 'Exercise high caution. Authentication or domain alignment checks failed. Verify request via out-of-band communication before taking action.';
  } else if (finalScore >= 20) {
    riskLevel = 'MEDIUM';
    riskBadgeColor = 'var(--color-warning-med)';
    verdictTitle = 'MEDIUM RISK: Header Anomalies Detected';
    analystGuidance = 'Some header parameters show inconsistencies (e.g. hop delays or script mailers). Inspect attachment/links carefully.';
  }

  return {
    score: finalScore,
    riskLevel,
    riskBadgeColor,
    verdictTitle,
    analystGuidance,
    findings
  };
}
