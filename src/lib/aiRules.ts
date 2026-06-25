export interface Recommendation {
  id: string;
  type: 'warning' | 'info' | 'action';
  title: string;
  message: string;
  actions: string[];
  references?: string[];
}

export interface SecurityContext {
  tool: 'dashboard' | 'port-scanner' | 'vulnerability' | 'password' | 'hash' | 'file-integrity' | 'url-analyzer';
  data?: any;
  userRole?: 'ADMIN' | 'SECURITY_ANALYST' | 'STUDENT';
}

export function evaluateRules(context: SecurityContext): Recommendation[] {
  const recommendations: Recommendation[] = [];

  switch (context.tool) {
    case 'dashboard':
      recommendations.push({
        id: 'dash-overview',
        type: 'info',
        title: 'System Security Hygiene',
        message: 'Ensure system containers are regularly updated and API rate limits are locked down.',
        actions: [
          'Review active jobs queue to ensure scan load is evenly balanced.',
          'Verify that critical vulnerability counts are addressed within SLA thresholds.'
        ],
        references: ['NIST SP 800-115']
      });
      break;

    case 'port-scanner':
      const ports = context.data?.ports || [];
      const openPorts = ports.filter((p: any) => p.state === 'open');

      if (openPorts.length > 0) {
        // RDP exposure check
        if (openPorts.some((p: any) => p.port === 3389)) {
          recommendations.push({
            id: 'port-3389-rdp',
            type: 'warning',
            title: 'Exposed Remote Desktop Protocol (RDP)',
            message: 'RDP (Port 3389) is open on the target host. Exposed RDP is a highly targeted vulnerability for ransomware attacks.',
            actions: [
              'Close port 3389 at the perimeter firewall immediately.',
              'Implement a secure VPN gateway for all remote management services.',
              'Enable Multi-Factor Authentication (MFA) and account lockout policies.'
            ],
            references: ['CIS Control 12.1', 'CVE-2019-0708 (BlueKeep)']
          });
        }
        
        // SSH check
        if (openPorts.some((p: any) => p.port === 22)) {
          recommendations.push({
            id: 'port-22-ssh',
            type: 'info',
            title: 'SSH Port Detected',
            message: 'SSH (Port 22) is open. Ensure password-based authentication is disabled and SSH keys are rotated.',
            actions: [
              'Enforce SSH key-based authentication only.',
              'Change default SSH configuration to block root logins.',
              'Configure Fail2ban or rate-limiting for SSH connection attempts.'
            ],
            references: ['NIST SP 800-53 AC-17']
          });
        }

        // FTP check
        if (openPorts.some((p: any) => p.port === 21)) {
          recommendations.push({
            id: 'port-21-ftp',
            type: 'warning',
            title: 'Cleartext FTP Service Enabled',
            message: 'FTP (Port 21) transmits credentials and data in cleartext, exposing the host to eavesdropping.',
            actions: [
              'Disable standard FTP services immediately.',
              'Migrate to SFTP (SSH File Transfer Protocol) or FTPS (FTP over SSL).'
            ],
            references: ['OWASP Top 10 A02:2021-Cryptographic Failures']
          });
        }

        // SMB check
        if (openPorts.some((p: any) => p.port === 445 || p.port === 139)) {
          recommendations.push({
            id: 'port-smb',
            type: 'warning',
            title: 'Exposed SMB File Sharing',
            message: 'SMB (Server Message Block) is open. This is a vector for lateral movement and remote code execution exploits.',
            actions: [
              'Restrict access to trusted internal IP subnets only.',
              'Ensure SMBv1 is disabled; enforce SMBv2/v3 with signing required.'
            ],
            references: ['EternalBlue (MS17-010)', 'NIST SP 800-160']
          });
        }
      } else {
        recommendations.push({
          id: 'port-general',
          type: 'info',
          title: 'Port Scanning Guidelines',
          message: 'Review network configurations and scan targets periodically. Active scans help uncover hidden host services.',
          actions: [
            'Compare port scan results with approved asset manifests.',
            'Report unmapped services to system administrators.'
          ]
        });
      }
      break;

    case 'vulnerability':
      const vulns = context.data?.vulnerabilities || [];
      const criticalCount = vulns.filter((v: any) => v.severity === 'CRITICAL').length;
      const highCount = vulns.filter((v: any) => v.severity === 'HIGH').length;

      if (criticalCount > 0) {
        recommendations.push({
          id: 'vuln-critical',
          type: 'warning',
          title: 'Immediate Patching Required',
          message: `${criticalCount} Critical vulnerabilities discovered on the target. Exploit scripts may be publicly available.`,
          actions: [
            'Apply available vendor security patches immediately.',
            'Quarantine the affected assets from the internal subnet.',
            'Implement temporary Web Application Firewall (WAF) rule sets.'
          ],
          references: ['CISA Known Exploited Vulnerabilities (KEV) Catalog']
        });
      }

      if (highCount > 0) {
        recommendations.push({
          id: 'vuln-high',
          type: 'action',
          title: 'High Severity Vulnerabilities Remediation',
          message: `${highCount} High severity CVEs detected. These typically grant user access or crash host processes.`,
          actions: [
            'Schedule remediation within 72 hours.',
            'Restrict network service access to validated clients.'
          ],
          references: ['NVD Severity Classification']
        });
      }

      if (vulns.length === 0) {
        recommendations.push({
          id: 'vuln-general',
          type: 'info',
          title: 'Vulnerability Scanning Strategy',
          message: 'Zero results found could mean the target is hardened or blocklists restricted the scanner.',
          actions: [
            'Perform credentialed vulnerability scans for deeper analysis.',
            'Update signature databases to match modern threat intelligence feeds.'
          ]
        });
      }
      break;

    case 'password':
      const score = context.data?.score ?? 100;
      const feedback = context.data?.feedback || [];

      if (score < 50) {
        recommendations.push({
          id: 'pwd-weak',
          type: 'warning',
          title: 'High Risk Password Strength',
          message: 'The submitted password is classified as WEAK. Brute force systems could crack it in seconds.',
          actions: [
            ...feedback.map((f: string) => `Fix issue: ${f}`),
            'Increase character length to at least 14 characters.',
            'Avoid using common vocabulary terms or sequential letters/numbers.'
          ],
          references: ['NIST SP 800-63B guidelines']
        });
      } else if (score < 75) {
        recommendations.push({
          id: 'pwd-mod',
          type: 'action',
          title: 'Moderate Password Strength',
          message: 'Password meets minimum constraints but lacks complex character structures.',
          actions: [
            'Inject randomized numbers or special characters (@, #, $, %).',
            'Consider utilizing a passphrase combining 4 unrelated random nouns.'
          ]
        });
      } else {
        recommendations.push({
          id: 'pwd-strong',
          type: 'info',
          title: 'Secure Password Standard Verified',
          message: 'The password scoring meets enterprise-level guidelines. Ready for credentials usage.',
          actions: [
            'Ensure this password is not reused across multiple platforms.',
            'Store it safely inside an encrypted local vault or key management service.'
          ]
        });
      }
      break;

    case 'hash':
      recommendations.push({
        id: 'hash-cryptography',
        type: 'info',
        title: 'Cryptographic Hashing Best Practices',
        message: 'Different hash algorithms fit different application roles:',
        actions: [
          'MD5 and SHA-1 are cryptographically broken. NEVER use them for storage passwords or identity assertions.',
          'For file integrity checks, SHA-256 provides excellent security checks.',
          'For user password storage, use salt-based slow algorithms like bcrypt, Argon2, or PBKDF2.'
        ],
        references: ['FIPS PUB 180-4']
      });
      break;

    case 'file-integrity':
      const integrity = context.data?.verified;
      if (integrity === false) {
        recommendations.push({
          id: 'file-modified',
          type: 'warning',
          title: 'File Tampering Alert!',
          message: 'The uploaded file hash mismatch with the stored base. The payload has been modified or corrupted.',
          actions: [
            'Reject execution or storage of the file.',
            'Track user upload IP and trace modification metadata.',
            'Verify stored base hashes in the database using a trusted administrative console.'
          ],
          references: ['OWASP File Integrity Monitoring (FIM)']
        });
      } else if (integrity === true) {
        recommendations.push({
          id: 'file-verified',
          type: 'info',
          title: 'File Integrity Confirmed',
          message: 'SHA-256 matches exactly. No modifications detected.',
          actions: [
            'File is safe to ingest into local data pipelines.',
            'Store file hash metadata inside audited database transactions.'
          ]
        });
      } else {
        recommendations.push({
          id: 'file-general',
          type: 'info',
          title: 'Integrity Verification Guidelines',
          message: 'Upload file packages to generate SHA-256 signatures, saving them as bases for future comparison.',
          actions: [
            'Always calculate hashes on the client side if possible to prevent payload interception.',
            'Implement read-only file shares for storing reference hashes.'
          ]
        });
      }
      break;

    case 'url-analyzer':
      const reputation = context.data?.reputation;
      const indicators = context.data?.indicators || {};

      if (reputation === 'Malicious') {
        recommendations.push({
          id: 'url-malicious',
          type: 'warning',
          title: 'Malicious Web Reputation Target',
          message: 'This URL is flagged as MALICIOUS in current reputation lists. Accessing this site may trigger drive-by malware.',
          actions: [
            'Block target URL domain system-wide at the DNS levels.',
            'Alert incident response teams regarding potential phishing vector attempts.',
            indicators.onBlocklist ? 'Domain matches global abuse intelligence feeds.' : 'Suspicious scripting or redirect structures detected.'
          ],
          references: ['MITRE ATT&CK T1566 Phishing']
        });
      } else if (reputation === 'Suspicious') {
        recommendations.push({
          id: 'url-suspicious',
          type: 'action',
          title: 'Suspicious Domain Reputation',
          message: 'The URL reputation is flagged as suspicious. Common factors include newly registered domains or self-signed SSL certs.',
          actions: [
            indicators.sslValid === false ? 'Warning: Target SSL certificate validation failed.' : 'Check target SSL issuer details.',
            'Warn system users regarding domain connection risk before redirection.'
          ]
        });
      } else if (reputation === 'Safe') {
        recommendations.push({
          id: 'url-safe',
          type: 'info',
          title: 'Reputation Verified Safe',
          message: 'URL domain is clean in known threat databases, with fully valid SSL certificates.',
          actions: [
            'Redirect standard connection traffic securely.'
          ]
        });
      } else {
        recommendations.push({
          id: 'url-general',
          type: 'info',
          title: 'URL Analysis Guidelines',
          message: 'Submit web connection links to query risk scoring.',
          actions: [
            'Verify that SSL certificate validation is enforced for all external sites.',
            'Analyze target domain registration age to identify potential typosquatting.'
          ]
        });
      }
      break;

    default:
      recommendations.push({
        id: 'gen-info',
        type: 'info',
        title: 'CyberShield SecOps Platform',
        message: 'Utilize active scanning tools to verify target server configurations.',
        actions: ['Regularly run port and vulnerability tests to uncover exposed services.']
      });
  }

  // Inject Role-based guidance overrides
  if (context.userRole === 'STUDENT') {
    recommendations.push({
      id: 'role-student-guideline',
      type: 'info',
      title: 'Educational Role Context',
      message: 'You are currently logged in with a Student role. Privileges are restricted:',
      actions: [
        'Scan targets are restricted to safe networks (e.g. scanme.nmap.org).',
        'Scans and analysis outputs are sanitized for education watermark.',
        'File integrity uploads are limited to 10MB.'
      ]
    });
  }

  return recommendations;
}
