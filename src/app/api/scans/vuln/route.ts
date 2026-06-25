import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserContext, errorResponse, checkRateLimit, logAudit } from '@/lib/api-utils';

interface VulnerabilityTemplate {
  cveId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  description: string;
  affectedService: string;
  cvssScore: number;
  remediation: string;
  references: string[];
}

const VULN_TEMPLATES: VulnerabilityTemplate[] = [
  {
    cveId: 'CVE-2023-49103',
    severity: 'CRITICAL',
    description: 'A critical vulnerability in the ownCloud php environment allows remote attackers to bypass authentication and execute arbitrary commands via the web console configuration panel.',
    affectedService: 'ownCloud/10.12.0',
    cvssScore: 10.0,
    remediation: 'Upgrade ownCloud instances to version 10.13.1 or apply the security hotfix from official vendor advisory.',
    references: ['https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-49103']
  },
  {
    cveId: 'CVE-2021-44228',
    severity: 'CRITICAL',
    description: 'Apache Log4j2 JNDI features used in configuration, log messages, and parameters do not protect against attacker-controlled LDAP and other JNDI related endpoints.',
    affectedService: 'Apache Log4j/2.14.1',
    cvssScore: 10.0,
    remediation: 'Upgrade to Log4j 2.15.0 or higher. For older versions, set system property "log4j2.formatMsgNoLookups" to true.',
    references: ['https://logging.apache.org/log4j/2.x/security.html']
  },
  {
    cveId: 'CVE-2022-22965',
    severity: 'HIGH',
    description: 'Spring Framework Spring4Shell vulnerability allows remote code execution (RCE) via data binding when running on JDK 9+ under Tomcat.',
    affectedService: 'Spring Core/5.3.17',
    cvssScore: 9.8,
    remediation: 'Upgrade Spring Framework to version 5.3.18 or 5.2.20. Upgrade Apache Tomcat to 10.0.20, 9.0.62, or 8.5.78.',
    references: ['https://spring.io/blog/2022/03/31/spring-framework-rce-early-announcement']
  },
  {
    cveId: 'CVE-2023-38606',
    severity: 'HIGH',
    description: 'A validation vulnerability in Apple WebKit allows malicious web content to bypass sandbox configurations and execute arbitrary code.',
    affectedService: 'Apple WebKit Core',
    cvssScore: 8.8,
    remediation: 'Apply system-wide operating system updates issued by Apple for OS patches immediately.',
    references: ['https://support.apple.com/en-us/HT213841']
  },
  {
    cveId: 'CVE-2018-11776',
    severity: 'MEDIUM',
    description: 'Apache Struts namespace validation vulnerability allows remote attackers to execute OGNL expressions in struts config actions.',
    affectedService: 'Apache Struts/2.5.16',
    cvssScore: 7.5,
    remediation: 'Upgrade Struts to version 2.5.17 or 2.3.35, which sanitizes default namespaces parameters.',
    references: ['https://cwiki.apache.org/confluence/display/WW/S2-057']
  },
  {
    cveId: 'CVE-2020-1938',
    severity: 'MEDIUM',
    description: 'Ghostcat vulnerability in Apache Tomcat AJP connector allows attackers to read arbitrary files from Tomcat root directory or execute commands.',
    affectedService: 'Apache Tomcat/9.0.30',
    cvssScore: 7.5,
    remediation: 'Disable AJP connector if unused, or restrict AJP socket connection access to localhost interface only.',
    references: ['https://www.cnvd.org.cn/webinfo/show/5419']
  },
  {
    cveId: 'CVE-2023-27163',
    severity: 'HIGH',
    description: 'Request Baskets up to version 1.2.1 is vulnerable to Server-Side Request Forgery (SSRF) via the API config endpoint.',
    affectedService: 'Request Baskets/1.2.1',
    cvssScore: 8.2,
    remediation: 'Upgrade Request Baskets software to version 1.2.2 or higher.',
    references: ['https://github.com/prakharprasath/CVE-2023-27163']
  },
  {
    cveId: 'CVE-2023-38408',
    severity: 'LOW',
    description: 'OpenSSH agent forwarding security restriction bypass vulnerability allows local agents hijacking under specialized environment.',
    affectedService: 'OpenSSH Agent/8.9p1',
    cvssScore: 4.2,
    remediation: 'Ensure ssh agent forwarding is only enabled for secure servers and restrict user privileges.',
    references: ['https://www.openssh.com/txt/release-8.9']
  }
];

async function runVulnerabilityScan(jobId: string, target: string, depth: string): Promise<void> {
  try {
    await db.updateScanJob(jobId, { status: 'RUNNING' });
    
    // Simulate scan delay (based on depth)
    const scanDelay = depth === 'deep' ? 5000 : depth === 'standard' ? 3500 : 2000;
    await new Promise((resolve) => setTimeout(resolve, scanDelay));

    // Select templates based on target and depth
    let vulns: VulnerabilityTemplate[] = [];
    
    if (target === 'scanme.nmap.org') {
      // scanme.nmap.org has limited vulnerabilities for security purposes
      vulns = [
        VULN_TEMPLATES.find(v => v.cveId === 'CVE-2023-38408')!, // Low OpenSSH
        {
          cveId: 'CVE-2023-25136',
          severity: 'MEDIUM',
          description: 'A pre-auth double free vulnerability in OpenSSH server releases 9.1 allows remote Denial of Service.',
          affectedService: 'OpenSSH/9.1',
          cvssScore: 6.5,
          remediation: 'Update OpenSSH to version 9.2 or apply strict connection rules.',
          references: ['https://www.openssh.com/txt/release-9.2']
        }
      ];
    } else {
      // Randomly select vulnerabilities based on depth
      let selectCount = depth === 'deep' ? 5 : depth === 'standard' ? 3 : 1;
      
      // Shuffle templates
      const shuffled = [...VULN_TEMPLATES].sort(() => Math.random() - 0.5);
      vulns = shuffled.slice(0, Math.min(selectCount, shuffled.length));
    }

    // Sort by severity (Critical first)
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFORMATIONAL': 0 };
    vulns.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

    // Construct summary counts
    const summary = {
      critical: vulns.filter(v => v.severity === 'CRITICAL').length,
      high: vulns.filter(v => v.severity === 'HIGH').length,
      medium: vulns.filter(v => v.severity === 'MEDIUM').length,
      low: vulns.filter(v => v.severity === 'LOW').length,
      informational: vulns.filter(v => v.severity === 'INFORMATIONAL').length
    };

    await db.updateScanJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      results: {
        target,
        vulnerabilities: vulns,
        summary
      }
    });
  } catch (err: any) {
    await db.updateScanJob(jobId, {
      status: 'FAILED',
      completedAt: new Date().toISOString(),
      errorMsg: err.message || 'Vulnerability audit failed.'
    });
  }
}

export async function POST(req: Request) {
  const user = getUserContext(req);
  if (!user) {
    return errorResponse('AUTH_TOKEN_MISSING', 'Authentication credentials missing or invalid.', 401);
  }

  try {
    const { target, depth } = await req.json();

    if (!target) {
      return errorResponse('VALIDATION_ERROR', 'Please provide a target host IP or Domain.');
    }

    // Safe targets checking for Student accounts
    const isStudent = user.role === 'STUDENT';
    if (isStudent && target !== 'scanme.nmap.org' && target !== 'localhost' && target !== '127.0.0.1') {
      return errorResponse('AUTH_INSUFFICIENT_PERMISSIONS', 'Student accounts are restricted to scanning scanme.nmap.org.');
    }

    // Rate limits check
    const allowed = await checkRateLimit(req, 'vulnerability_scan', user.id);
    if (!allowed) {
      await logAudit(req, user.id, `POST /api/scans/vuln target=${target}`, 'VULNERABILITY_SCAN', 'failure', { error: 'Rate limit exceeded' });
      return errorResponse('RATE_LIMIT_EXCEEDED', 'Vulnerability scan rate limit exceeded. Please try again later.', 429);
    }

    // Create the job record
    const job = await db.createScanJob({
      type: 'VULNERABILITY_ASSESSMENT',
      target,
      scanConfig: { depth: depth || 'standard' },
      userId: user.id
    });

    // Run audit and wait for it to complete (crucial for Serverless platforms like Vercel)
    await runVulnerabilityScan(job.id, target, depth || 'standard');

    // Retrieve the fully finished scan job with results
    const finishedJob = await db.getScanJob(job.id);

    // Audit logs entry
    await logAudit(req, user.id, `POST /api/scans/vuln target=${target} jobId=${job.id}`, 'VULNERABILITY_SCAN', 'success');

    return NextResponse.json(finishedJob || job);
  } catch (err: any) {
    console.error('Failed to initiate vulnerability scan:', err);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.', 500);
  }
}
