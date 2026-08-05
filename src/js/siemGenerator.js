/**
 * SIEM Query & YARA Rule IoC Generator
 */

export function generateSiemQueries(parsedData, threatData) {
  const { extracted, hops } = parsedData;

  const senderIp = extracted.xOriginatingIp || (hops.length > 0 ? hops[0].fromIp : '') || '198.51.100.42';
  const fromEmail = extracted.fromParsed?.email || '';
  const fromDomain = extracted.fromParsed?.domain || '';
  const returnPath = extracted.returnPathParsed?.email || '';
  const returnPathDomain = extracted.returnPathParsed?.domain || '';
  const subject = (extracted.subject || '').replace(/"/g, '\\"');
  const messageId = extracted.messageId || '';

  // 1. Splunk SPL
  const splunkSpl = `index=email OR index=m365_exchange
| search (src_ip="${senderIp}" OR sender="${fromEmail}" OR return_path="${returnPath}" OR header_from_domain="${fromDomain}")
| table _time, src_ip, sender, return_path, subject, action, dmarc_verdict
| sort - _time`;

  // 2. Microsoft Sentinel KQL
  const sentinelKql = `EmailEvents
| where TimeGenerated >= ago(7d)
| where SenderIPv4 == "${senderIp}" 
   or SenderFromAddress =~ "${fromEmail}" 
   or ReturnPath =~ "${returnPath}" 
   or Subject contains "${subject}"
| project TimeGenerated, Subject, SenderFromAddress, ReturnPath, SenderIPv4, DeliveryAction, ThreatTypes`;

  // 3. YARA Rule Generator
  const cleanRuleName = (fromDomain || 'email_threat').replace(/[^a-zA-Z0-9]/g, '_');
  const yaraRule = `rule Email_Header_Threat_${cleanRuleName} {
    meta:
        description = "Detects suspicious email headers originating from ${fromDomain || 'unknown'}"
        author = "CyberShield Header Analyzer"
        date = "${new Date().toISOString().split('T')[0]}"
        threat_level = "${threatData.riskLevel}"
        risk_score = ${threatData.score}
    strings:
        $hdr_from = "From: " ascii nocase
        $domain_from = "${fromDomain}" ascii nocase
        $return_path = "${returnPath}" ascii nocase
        $sender_ip = "${senderIp}" ascii nocase
    condition:
        all of ($hdr_from, $domain_from) and ($return_path or $sender_ip)
}`;

  // 4. Extracted IoCs
  const iocs = [
    { type: 'Sender IP', value: senderIp, category: 'Network IoC' },
    { type: 'Header From Domain', value: fromDomain, category: 'Domain IoC' },
    { type: 'Return-Path Email', value: returnPath, category: 'Email IoC' },
    { type: 'Return-Path Domain', value: returnPathDomain, category: 'Domain IoC' },
    { type: 'Message-ID', value: messageId, category: 'Header IoC' }
  ].filter(i => i.value);

  return {
    splunkSpl,
    sentinelKql,
    yaraRule,
    iocs
  };
}
