export const PRESETS = {
  ceo_fraud: {
    name: "🔴 CEO Fraud / Wire Transfer Phishing",
    description: "Display name spoofing, mismatched Return-Path & Reply-To, sent via suspicious PHP script.",
    raw: `Received: from mail-relay.attacker-vps.com (attacker-vps.com [198.51.100.42])
	by mx.target-corp.com (Postfix) with ESMTPS id 4StxYp12z7z90A
	for <cfo@target-corp.com>; Fri, 31 Jul 2026 09:14:22 +0000 (UTC)
Received: from localhost (unknown [192.168.1.105])
	by mail-relay.attacker-vps.com (Postfix) with ESMTP id 3qR0x918vL
	for <cfo@target-corp.com>; Fri, 31 Jul 2026 08:45:10 +0000 (UTC)
Delivered-To: cfo@target-corp.com
Received-SPF: pass (target-corp.com: domain of admin@attacker-vps.com designates 198.51.100.42 as permitted sender) receiver=target-corp.com; client-ip=198.51.100.42; envelope-from=admin@attacker-vps.com;
Authentication-Results: mx.target-corp.com;
	dkim=fail reason="signature verify failed" header.d=attacker-vps.com;
	spf=pass (google.com: domain of admin@attacker-vps.com designates 198.51.100.42 as permitted sender);
	dmarc=fail (p=REJECT dis=NONE) header.from=target-corp.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=attacker-vps.com; s=2024;
	h=from:to:subject:date:message-id:reply-to;
	bh=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=;
	b=K9aB1xyz...==
From: "Robert Vance (CEO)" <ceo@target-corp.com>
To: "Sarah Jenkins (CFO)" <cfo@target-corp.com>
Reply-To: "Executive Direct" <robert.vance.ceo.exec@gmail-secure-portal.com>
Return-Path: <admin@attacker-vps.com>
Subject: URGENT: Confidential Wire Transfer Request - Acquisition
Date: Fri, 31 Jul 2026 08:44:50 +0000
Message-ID: <20260731084450.91284.qmail@attacker-vps.com>
X-Mailer: PHPMailer 5.2.28 (https://github.com/PHPMailer/PHPMailer)
X-Originating-IP: [198.51.100.42]
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8`
  },
  paypal_spoof: {
    name: "🟠 PayPal Credential Harvester (Typosquatting)",
    description: "Fake security notice with typosquatting domain (paypa1-security-check.com) and failed DKIM/DMARC.",
    raw: `Received: from mx01.paypa1-security-check.com (mx01.paypa1-security-check.com [203.0.113.88])
	by mailin.userdomain.net (8.14.4/8.14.4) with ESMTP id 67V92kL019283
	for <victim@userdomain.net>; Fri, 31 Jul 2026 11:05:01 GMT
Received: from mail-node4.spammaster.net ([198.51.100.199])
	by mx01.paypa1-security-check.com with SMTP id 918237912;
	Fri, 31 Jul 2026 11:02:15 GMT
Received-SPF: softfail (userdomain.net: domain of service@paypa1-security-check.com does not designate 203.0.113.88 as permitted sender)
Authentication-Results: mailin.userdomain.net;
	dkim=none;
	spf=softfail (sender IP 203.0.113.88);
	dmarc=fail (p=quarantine) header.from=paypal.com
From: "PayPal Security Team" <service@paypal.com>
To: victim@userdomain.net
Return-Path: <service@paypa1-security-check.com>
Reply-To: support@paypa1-security-check.com
Subject: ACTION REQUIRED: Your PayPal Account Has Been Suspended!
Date: Fri, 31 Jul 2026 11:01:40 +0000
Message-ID: <CMD-99201-PAYPAL-SEC@paypa1-security-check.com>
X-Mailer: Python-smtplib/3.10
Content-Type: text/html; charset="UTF-8"`
  },
  malware_drop: {
    name: "🟡 Malware Attachment & Relay Delay",
    description: "Suspicious 28-minute hop queue delay, local internal IP exposure, and generic webmail mailer.",
    raw: `Received: from mail-server.local (unknown [10.0.4.12])
	by mx.corporate-gateway.org (Postfix) with ESMTPS id 92A1B02C
	for <finance@corporate-gateway.org>; Fri, 31 Jul 2026 13:40:00 +0000
Received: from botnet-node.darknet.ru (unknown [198.51.100.250])
	by mail-server.local (Postfix) with ESMTP id 1192830
	for <finance@corporate-gateway.org>; Fri, 31 Jul 2026 13:12:00 +0000
Received-SPF: neutral (corporate-gateway.org: 198.51.100.250 is neither permitted nor denied)
Authentication-Results: mx.corporate-gateway.org;
	dkim=none;
	spf=neutral;
	dmarc=none
From: "Invoice Billing Dept" <billing@fast-invoicing-services.net>
To: finance@corporate-gateway.org
Return-Path: <bounce-9912@fast-invoicing-services.net>
Subject: Past Due Invoice #884912 - Urgent Payment Remittance
Date: Fri, 31 Jul 2026 13:11:30 +0000
Message-ID: <INV-2026-994821@fast-invoicing-services.net>
X-Mailer: GoPhish v0.12.0
Content-Type: multipart/mixed; boundary="----=_NextPart_000_001B_01D9"
X-Attachment-Name: Invoice_JUL2026_PDF.exe`
  },
  legitimate_email: {
    name: "🟢 Legitimate Corporate Email (Pass All Checks)",
    description: "Fully authenticated Google Workspace email with aligned SPF, DKIM, and DMARC.",
    raw: `Received: from mail-pj1-f41.google.com (mail-pj1-f41.google.com [209.85.216.41])
	by mx.google.com with SMTPS id j12-20020a170903330c00b003d1
	for <alex.smith@acme-corp.com>; Fri, 31 Jul 2026 14:02:10 -0700 (PDT)
Received: by mail-pj1-f41.google.com with SMTP id j12-20020a170903330c00b003d1
	for <alex.smith@acme-corp.com>; Fri, 31 Jul 2026 14:02:08 -0700 (PDT)
Received-SPF: pass (google.com: domain of jason.corp@acme-corp.com designates 209.85.216.41 as permitted sender) client-ip=209.85.216.41;
Authentication-Results: mx.google.com;
	dkim=pass header.i=@acme-corp.com header.s=20230601 header.b=X8aL9k;
	spf=pass (google.com: domain of jason.corp@acme-corp.com designates 209.85.216.41 as permitted sender) smtp.mailfrom=jason.corp@acme-corp.com;
	dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=acme-corp.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
	d=acme-corp.com; s=20230601; t=1690837328; x=1691442128;
	h=to:subject:message-id:date:from:mime-version:dkim-signature;
	bh=aBc123XYZ...=;
	b=X8aL9k...==
From: "Jason Vance" <jason.corp@acme-corp.com>
To: "Alex Smith" <alex.smith@acme-corp.com>
Subject: Q3 Cybersecurity Strategy & Architecture Review
Date: Fri, 31 Jul 2026 14:02:05 -0700
Message-ID: <CAL+vGz=18293812938129@mail.gmail.com>
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Thunderbird/115.0
Return-Path: <jason.corp@acme-corp.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8`
  }
};
