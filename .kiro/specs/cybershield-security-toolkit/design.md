# Technical Design Document

## System Overview

The CyberShield Security Toolkit is a comprehensive web-based cybersecurity platform built as a modern, containerized microservices architecture. The system provides nine integrated security tools accessible through a role-based access control system, with comprehensive audit logging and an AI-powered rule-based security assistant.

### Architecture Philosophy

The platform follows a three-tier architecture pattern with clear separation of concerns:
- **Presentation Layer**: Next.js 15 frontend with TypeScript, TailwindCSS, and Shadcn/UI
- **Application Layer**: Node.js/Express REST API with JWT authentication and role-based authorization
- **Data Layer**: PostgreSQL database managed through Prisma ORM
- **Computation Layer**: Containerized Python microservices for security scanning operations

All components are organized in a monorepo structure with workspace management, enabling shared code, consistent tooling, and streamlined development workflows.

### Key Design Principles

1. **Security First**: All components implement defense-in-depth with JWT authentication, bcrypt password hashing, rate limiting, input validation, CORS policies, and Helmet security headers
2. **Scalability**: Security microservices run as independent containers that can be horizontally scaled for load distribution
3. **Observability**: Comprehensive audit logging tracks all security-relevant actions with immutable records
4. **Performance**: Aggressive caching, optimized queries, and asynchronous job processing ensure responsive user experience
5. **Maintainability**: Clear separation of concerns, typed interfaces, and consistent coding patterns across all services

## Component Architecture

### Frontend Application (Next.js 15)

**Technology Stack**:
- Next.js 15 with App Router
- TypeScript for type safety
- TailwindCSS for styling
- Shadcn/UI for component library
- Framer Motion for animations
- React Query for data fetching and caching

**Key Modules**:

1. **Authentication Module**
   - Login/logout flows with JWT token management
   - Automatic token refresh using refresh tokens
   - Protected route HOCs that verify authentication
   - Secure token storage in HTTP-only cookies

2. **Dashboard Module**
   - Real-time metrics display with WebSocket updates
   - Security metrics: scan counts, active jobs, critical vulnerabilities
   - System health indicators for all services
   - Recent scan history with status indicators
   - Role-based widget rendering (read-only for students)
   - Auto-refresh every 30 seconds

3. **Security Tools Module**
   - Nine integrated security tools with consistent UI patterns
   - Asynchronous job submission and polling
   - Real-time status updates
   - Result visualization and export
   - Tool-specific forms with validation

4. **Admin Panel Module**
   - User management (CRUD operations)
   - System metrics and monitoring
   - Rate limit configuration
   - Container status monitoring
   - Audit log viewer with filtering

5. **AI Assistant Module**
   - Context-aware security guidance
   - Rule-based recommendation engine
   - Tool-specific help and suggestions
   - Proactive alerts for high-severity findings

**State Management**:
- React Query for server state (caching, invalidation, optimistic updates)
- Zustand for client state (UI preferences, transient data)
- Context API for authentication state

**Routing Strategy**:
- App Router with file-based routing
- Middleware for authentication checks
- Role-based route protection
- Dynamic route parameters for scan results

### Backend API (Node.js/Express)

**Technology Stack**:
- Node.js with Express.js
- TypeScript for type safety
- Prisma ORM for database access
- JWT for authentication
- bcrypt for password hashing
- express-rate-limit for rate limiting
- Helmet for security headers
- CORS for cross-origin control

**Architecture Pattern**: Layered architecture with clear separation

1. **Controller Layer**
   - HTTP request/response handling
   - Input validation using Zod schemas
   - Error handling and response formatting
   - Route-specific business logic orchestration

2. **Service Layer**
   - Business logic implementation
   - Transaction management
   - External service integration
   - Data transformation and aggregation

3. **Repository Layer**
   - Database access abstraction
   - Prisma query building
   - Data mapping and serialization
   - Query optimization

4. **Middleware Stack**
   - Authentication: JWT token validation
   - Authorization: Role-based permission checks
   - Rate limiting: Per-user, per-endpoint limits
   - Input sanitization: XSS and injection prevention
   - Error handling: Centralized error processing
   - Audit logging: Automatic event capture
   - CORS: Origin validation
   - Helmet: Security headers

**Key API Endpoints**:

```typescript
// Authentication
POST   /api/auth/register        // User registration
POST   /api/auth/login           // User login (returns access + refresh tokens)
POST   /api/auth/refresh         // Token refresh
POST   /api/auth/logout          // Logout (invalidate refresh token)

// User Management (Admin only)
GET    /api/users                // List all users
POST   /api/users                // Create user
GET    /api/users/:id            // Get user details
PATCH  /api/users/:id            // Update user
DELETE /api/users/:id            // Deactivate user

// Dashboard
GET    /api/dashboard/metrics    // Get dashboard metrics
GET    /api/dashboard/health     // Get system health status

// Port Scanner
POST   /api/scans/port           // Initiate port scan
GET    /api/scans/port/:jobId    // Get scan status/results

// Vulnerability Assessment
POST   /api/scans/vuln           // Initiate vulnerability scan
GET    /api/scans/vuln/:jobId    // Get scan status/results

// Password Analyzer
POST   /api/tools/password/analyze   // Analyze password strength
POST   /api/tools/password/generate  // Generate secure password

// Hash Generator
POST   /api/tools/hash           // Generate hashes

// File Integrity Checker
POST   /api/tools/file/check     // Upload and check file integrity
POST   /api/tools/file/verify    // Verify against stored hash

// URL Reputation Analyzer
POST   /api/tools/url/analyze    // Analyze URL reputation

// Report Generator
POST   /api/reports              // Generate report
GET    /api/reports/:id          // Download report
GET    /api/reports              // List user reports

// Audit Logs
GET    /api/audit                // Query audit logs (filtered by role)

// Admin Panel
GET    /api/admin/metrics        // System metrics
PATCH  /api/admin/rate-limits    // Configure rate limits
GET    /api/admin/containers     // Container status
```

**Authentication Flow**:

1. User submits credentials to `/api/auth/login`
2. Backend validates credentials against database (bcrypt comparison)
3. On success, generate two JWT tokens:
   - Access token: 15-minute expiration, contains user ID and role
   - Refresh token: 7-day expiration, stored in database
4. Return both tokens to client
5. Client stores access token in memory, refresh token in HTTP-only cookie
6. Client includes access token in Authorization header for API calls
7. When access token expires, client sends refresh token to `/api/auth/refresh`
8. Backend validates refresh token against database and issues new access token

**Authorization Flow**:

1. Middleware extracts JWT from Authorization header
2. Verify JWT signature and expiration
3. Extract user ID and role from token payload
4. Check if user role has permission for the requested endpoint
5. Attach user context to request object
6. Proceed to route handler or return 403 Forbidden

**Job Processing Architecture**:

For long-running security scans (port scans, vulnerability assessments):

1. API receives scan request
2. Create `ScanJob` record in database with status "pending"
3. Return job ID immediately to client (< 500ms)
4. Dispatch job to available Security Microservice via message queue or HTTP
5. Update job status to "running"
6. Client polls `/api/scans/:type/:jobId` for status updates
7. When scan completes, microservice posts results to callback endpoint
8. API updates job status to "completed" and stores results
9. Client retrieves final results

### Database Schema (PostgreSQL + Prisma)

**Core Tables**:

```prisma
model User {
  id            String   @id @default(uuid())
  username      String   @unique
  email         String   @unique
  passwordHash  String
  role          Role
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  refreshTokens RefreshToken[]
  scanJobs      ScanJob[]
  reports       Report[]
  auditLogs     AuditLog[]
}

enum Role {
  ADMIN
  SECURITY_ANALYST
  STUDENT
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([userId])
}

model ScanJob {
  id          String      @id @default(uuid())
  type        ScanType
  target      String
  scanConfig  Json
  status      JobStatus
  results     Json?
  errorMsg    String?
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  createdAt   DateTime    @default(now())
  completedAt DateTime?
  
  @@index([userId, createdAt])
  @@index([status])
}

enum ScanType {
  PORT_SCAN
  VULNERABILITY_ASSESSMENT
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model FileHash {
  id        String   @id @default(uuid())
  filename  String
  fileSize  Int
  sha256    String
  userId    String
  createdAt DateTime @default(now())
  
  @@index([sha256])
  @@index([userId, createdAt])
}

model UrlAnalysis {
  id          String   @id @default(uuid())
  url         String
  reputation  String
  riskScore   Int
  analysis    Json
  userId      String
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  
  @@index([url, expiresAt])
}

model Report {
  id        String       @id @default(uuid())
  format    ReportFormat
  content   Bytes
  jobIds    String[]
  userId    String
  user      User         @relation(fields: [userId], references: [id])
  createdAt DateTime     @default(now())
  expiresAt DateTime
  
  @@index([userId, createdAt])
}

enum ReportFormat {
  PDF
  CSV
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String
  actionType String
  ipAddress  String
  outcome    String
  metadata   Json?
  createdAt  DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([actionType, createdAt])
}

model RateLimit {
  id        String   @id @default(uuid())
  tool      String   @unique
  limit     Int
  window    Int      // in seconds
  updatedAt DateTime @updatedAt
}
```

**Database Design Decisions**:

1. **UUID Primary Keys**: Prevent enumeration attacks and enable distributed ID generation
2. **Indexes**: Strategic indexes on foreign keys, status fields, and timestamp columns for query optimization
3. **JSON Fields**: Flexible storage for scan configurations and results without schema rigidity
4. **Cascade Deletes**: Automatic cleanup of related records (refresh tokens, etc.)
5. **Immutable Audit Logs**: No update/delete operations, only inserts
6. **TTL Fields**: `expiresAt` for automatic cleanup of cached data and reports

### Security Microservices (Python + Docker)

**Technology Stack**:
- Python 3.11+
- Nmap for port scanning
- CVE database integration for vulnerability assessment
- FastAPI for HTTP API
- Docker for containerization
- Redis for job queue (optional)

**Microservice Architecture**:

Each security microservice is a standalone containerized service that:
1. Exposes HTTP API for job submission
2. Processes jobs asynchronously
3. Posts results back to backend API
4. Maintains internal job queue
5. Reports health status

**Port Scanner Microservice**:

```python
# API Endpoints
POST /scan/port
  Request: {
    "jobId": "uuid",
    "target": "192.168.1.1 or example.com",
    "scanType": "TCP_CONNECT | SYN_STEALTH | UDP | COMPREHENSIVE",
    "ports": "1-1000 or specific ports"
  }
  Response: { "jobId": "uuid", "status": "accepted" }

GET /scan/port/{jobId}
  Response: {
    "jobId": "uuid",
    "status": "pending|running|completed|failed",
    "progress": 0-100,
    "results": { ... }
  }

GET /health
  Response: { "status": "healthy", "activeJobs": 5 }
```

**Nmap Integration**:

```python
import nmap

def execute_port_scan(target: str, scan_type: str, ports: str):
    nm = nmap.PortScanner()
    
    scan_args_map = {
        "TCP_CONNECT": "-sT",
        "SYN_STEALTH": "-sS",
        "UDP": "-sU",
        "COMPREHENSIVE": "-sS -sV -sC -O"
    }
    
    nm.scan(hosts=target, ports=ports, arguments=scan_args_map[scan_type])
    
    results = []
    for host in nm.all_hosts():
        for proto in nm[host].all_protocols():
            ports = nm[host][proto].keys()
            for port in ports:
                port_info = nm[host][proto][port]
                results.append({
                    "port": port,
                    "state": port_info["state"],
                    "service": port_info.get("name", "unknown"),
                    "version": port_info.get("version", "")
                })
    
    return results
```

**Vulnerability Assessment Microservice**:

```python
# API Endpoints
POST /scan/vulnerability
  Request: {
    "jobId": "uuid",
    "target": "192.168.1.1 or example.com",
    "depth": "basic | standard | deep"
  }
  Response: { "jobId": "uuid", "status": "accepted" }

GET /scan/vulnerability/{jobId}
  Response: {
    "jobId": "uuid",
    "status": "pending|running|completed|failed",
    "vulnerabilities": [
      {
        "cveId": "CVE-2023-12345",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFORMATIONAL",
        "description": "...",
        "affectedService": "...",
        "remediation": "..."
      }
    ]
  }
```

**CVE Database Integration**:

- Local CVE database snapshot for offline matching
- Periodic updates from NVD (National Vulnerability Database)
- Severity scoring based on CVSS v3.1
- Remediation recommendations from vendor advisories

**Container Orchestration**:

- Multiple microservice instances for load distribution
- Health check endpoints for container monitoring
- Auto-restart on failure
- Resource limits (CPU, memory) per container
- Docker Compose for local development
- Kubernetes-ready for production scaling

### AI Security Assistant (Rule-Based Expert System)

**Architecture**: Forward-chaining rule engine without LLM

**Knowledge Base Structure**:

```typescript
interface Rule {
  id: string;
  condition: (context: SecurityContext) => boolean;
  action: (context: SecurityContext) => Recommendation;
  priority: number;
}

interface SecurityContext {
  tool: string;
  findings: Finding[];
  userRole: Role;
  scanHistory: ScanJob[];
}

interface Recommendation {
  type: "warning" | "info" | "action";
  message: string;
  actions?: string[];
  references?: string[];
}
```

**Rule Categories**:

1. **Vulnerability Rules**: Match CVE patterns and provide remediation
2. **Port Risk Rules**: Identify dangerous open ports (RDP, SMB, Telnet)
3. **Password Strength Rules**: Suggest specific improvements based on weaknesses
4. **Threshold Rules**: Alert when severity thresholds are exceeded
5. **Best Practice Rules**: Provide general security guidance

**Example Rules**:

```typescript
// Port risk rule
{
  id: "risky-port-rdp",
  condition: (ctx) => ctx.findings.some(f => f.port === 3389 && f.state === "open"),
  action: (ctx) => ({
    type: "warning",
    message: "RDP (port 3389) is exposed to the network. This is a common attack vector.",
    actions: [
      "Restrict RDP access to specific IP addresses",
      "Use VPN for remote access",
      "Enable Network Level Authentication (NLA)",
      "Implement account lockout policies"
    ],
    references: ["CIS Controls 4.1", "NIST 800-53 AC-17"]
  }),
  priority: 9
}

// Vulnerability severity threshold rule
{
  id: "critical-vuln-threshold",
  condition: (ctx) => ctx.findings.filter(f => f.severity === "CRITICAL").length >= 3,
  action: (ctx) => ({
    type: "action",
    message: `${ctx.findings.filter(f => f.severity === "CRITICAL").length} critical vulnerabilities detected. Immediate action required.`,
    actions: [
      "Prioritize patching for all CRITICAL vulnerabilities",
      "Isolate affected systems if possible",
      "Review security incident response plan"
    ]
  }),
  priority: 10
}

// Password weakness rule
{
  id: "password-too-short",
  condition: (ctx) => ctx.findings.password.length < 12,
  action: (ctx) => ({
    type: "info",
    message: "Password is too short. Modern best practices recommend minimum 12 characters.",
    actions: ["Increase password length to at least 12 characters"]
  }),
  priority: 5
}
```

**Rule Engine Implementation**:

```typescript
class RuleEngine {
  private rules: Rule[] = [];
  
  addRule(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  evaluate(context: SecurityContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        recommendations.push(rule.action(context));
      }
    }
    
    return recommendations;
  }
}
```

**Context-Aware Guidance**:

The AI assistant maintains context awareness by:
- Tracking the active security tool
- Analyzing scan results in real-time
- Considering user role for tailored recommendations
- Reviewing recent scan history for patterns
- Proactively alerting when thresholds are exceeded

## Data Models and Interfaces

### TypeScript Interfaces

```typescript
// Authentication
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "SECURITY_ANALYST" | "STUDENT";
  createdAt: string;
}

// Port Scanner
interface PortScanRequest {
  target: string;
  scanType: "TCP_CONNECT" | "SYN_STEALTH" | "UDP" | "COMPREHENSIVE";
  ports?: string;
}

interface PortScanResult {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  results?: {
    target: string;
    ports: {
      port: number;
      state: "open" | "closed" | "filtered";
      service: string;
      version: string;
    }[];
    scanDuration: number;
  };
  errorMsg?: string;
}

// Vulnerability Assessment
interface VulnerabilityAssessmentRequest {
  target: string;
  depth: "basic" | "standard" | "deep";
}

interface VulnerabilityFinding {
  cveId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  description: string;
  affectedService: string;
  cvssScore: number;
  remediation: string;
  references: string[];
}

interface VulnerabilityAssessmentResult {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  results?: {
    target: string;
    vulnerabilities: VulnerabilityFinding[];
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      informational: number;
    };
  };
}

// Password Analyzer
interface PasswordAnalysisRequest {
  password: string;
}

interface PasswordAnalysisResult {
  score: number; // 0-100
  strength: "Weak" | "Moderate" | "Strong";
  feedback: string[];
  breakdown: {
    length: number;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    hasCommonPatterns: boolean;
    isDictionaryWord: boolean;
  };
}

interface PasswordGenerateRequest {
  length: number; // 8-128
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}

interface PasswordGenerateResult {
  password: string;
  strength: number;
}

// Hash Generator
interface HashGenerateRequest {
  input: string;
}

interface HashGenerateResult {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
  metadata: {
    inputLength: number;
    generatedAt: string;
  };
}

// File Integrity Checker
interface FileIntegrityCheckRequest {
  file: File;
}

interface FileIntegrityCheckResult {
  filename: string;
  fileSize: number;
  sha256: string;
  timestamp: string;
}

interface FileIntegrityVerifyRequest {
  file: File;
}

interface FileIntegrityVerifyResult {
  verified: boolean;
  currentHash: string;
  storedHash?: string;
  storedAt?: string;
  message: string;
}

// URL Reputation Analyzer
interface UrlReputationRequest {
  url: string;
}

interface UrlReputationResult {
  url: string;
  reputation: "Safe" | "Suspicious" | "Malicious";
  riskScore: number; // 0-100
  indicators: {
    domainAge?: number;
    sslValid: boolean;
    onBlocklist: boolean;
    registrationDate?: string;
    threatCategories?: string[];
  };
  analysis: string;
  cached: boolean;
}

// Report Generator
interface ReportGenerateRequest {
  format: "PDF" | "CSV";
  jobIds: string[];
  includeExecutiveSummary: boolean;
}

interface ReportGenerateResult {
  reportId: string;
  format: "PDF" | "CSV";
  downloadUrl: string;
  generatedAt: string;
  expiresAt: string;
}

// Audit Log
interface AuditLogQuery {
  userId?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}

interface AuditLogEntry {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  actionType: string;
  ipAddress: string;
  outcome: "success" | "failure";
  metadata?: Record<string, any>;
  createdAt: string;
}
```

## Error Handling Strategy

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### Error Categories

1. **Authentication Errors** (401)
   - Invalid credentials: `AUTH_INVALID_CREDENTIALS`
   - Expired token: `AUTH_TOKEN_EXPIRED`
   - Invalid token: `AUTH_INVALID_TOKEN`
   - Missing token: `AUTH_TOKEN_MISSING`

2. **Authorization Errors** (403)
   - Insufficient permissions: `AUTH_INSUFFICIENT_PERMISSIONS`
   - Role required: `AUTH_ROLE_REQUIRED`
   - Resource access denied: `AUTH_ACCESS_DENIED`

3. **Validation Errors** (400)
   - Invalid input: `VALIDATION_INVALID_INPUT`
   - Missing required field: `VALIDATION_REQUIRED_FIELD`
   - Invalid format: `VALIDATION_INVALID_FORMAT`

4. **Rate Limit Errors** (429)
   - Rate limit exceeded: `RATE_LIMIT_EXCEEDED`

5. **Not Found Errors** (404)
   - Resource not found: `RESOURCE_NOT_FOUND`
   - User not found: `USER_NOT_FOUND`
   - Job not found: `JOB_NOT_FOUND`

6. **Server Errors** (500)
   - Internal error: `INTERNAL_SERVER_ERROR`
   - Database error: `DATABASE_ERROR`
   - External service error: `EXTERNAL_SERVICE_ERROR`

7. **Service Unavailable** (503)
   - Database connection failed: `SERVICE_DATABASE_UNAVAILABLE`
   - Microservice unavailable: `SERVICE_SCANNER_UNAVAILABLE`

### Error Handling Implementation

```typescript
// Centralized error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with severity
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Create audit log for security-relevant errors
  if (err instanceof AuthenticationError || err instanceof AuthorizationError) {
    auditService.logEvent({
      action: req.path,
      outcome: "failure",
      userId: req.user?.id,
      ipAddress: req.ip,
      metadata: { error: err.message }
    });
  }

  // Map error to response
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_INVALID_INPUT",
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default to 500
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString()
    }
  });
});
```

## Security Implementation Details

### Password Security

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(plaintext: string): Promise<string> {
  return await bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plaintext, hash);
}

function validatePasswordComplexity(password: string): boolean {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return password.length >= minLength && hasUppercase && hasLowercase && hasNumber;
}
```

### JWT Token Management

```typescript
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

interface TokenPayload {
  userId: string;
  role: string;
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("AUTH_TOKEN_EXPIRED");
    }
    throw new AuthenticationError("AUTH_INVALID_TOKEN");
  }
}

async function verifyRefreshToken(token: string): Promise<string | null> {
  const storedToken = await db.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!storedToken || storedToken.expiresAt < new Date()) {
    return null;
  }
  
  return storedToken.userId;
}
```

### Input Validation and Sanitization

```typescript
import { z } from "zod";
import validator from "validator";

// Zod schemas for request validation
const portScanSchema = z.object({
  target: z.string().refine((val) => validator.isIP(val) || validator.isFQDN(val), {
    message: "Target must be a valid IP address or domain name"
  }),
  scanType: z.enum(["TCP_CONNECT", "SYN_STEALTH", "UDP", "COMPREHENSIVE"]),
  ports: z.string().optional()
});

const passwordAnalysisSchema = z.object({
  password: z.string().min(1).max(128)
});

const urlAnalysisSchema = z.object({
  url: z.string().refine((val) => validator.isURL(val, { require_protocol: true }), {
    message: "Must be a valid URL with protocol"
  })
});

// Input sanitization
function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_INVALID_INPUT",
            message: "Invalid input data",
            details: error.errors,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  };
}
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

// Per-endpoint rate limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many authentication attempts" } }
});

const portScanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: { code: "RATE_LIMIT_EXCEEDED", message: "Port scan limit exceeded" } }
});

const vulnScanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip
});

const fileCheckLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip
});

const urlAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Apply to routes
app.post("/api/auth/login", authLimiter, loginHandler);
app.post("/api/scans/port", authenticate, portScanLimiter, portScanHandler);
app.post("/api/scans/vuln", authenticate, vulnScanLimiter, vulnScanHandler);
```

### CORS Configuration

```typescript
import cors from "cors";

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Security Headers (Helmet)

```typescript
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.BACKEND_URL],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true
}));
```

### CSRF Protection

```typescript
import csrf from "csurf";

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  }
});

// Apply to state-changing routes
app.post("/api/users", authenticate, csrfProtection, createUserHandler);
app.patch("/api/users/:id", authenticate, csrfProtection, updateUserHandler);
```

## Performance Optimization

### Database Query Optimization

1. **Indexed Queries**: All foreign keys and frequently queried fields have indexes
2. **Pagination**: Implement cursor-based pagination for large result sets
3. **Query Limits**: Default limit of 100 records, maximum 1000
4. **Select Optimization**: Only select required fields, avoid `SELECT *`
5. **Connection Pooling**: Prisma connection pool with max 10 connections

```typescript
// Example optimized query
const scanJobs = await db.scanJob.findMany({
  where: {
    userId: req.user.id,
    createdAt: { gte: thirtyDaysAgo }
  },
  select: {
    id: true,
    type: true,
    status: true,
    createdAt: true,
    // Exclude large 'results' field
  },
  orderBy: { createdAt: "desc" },
  take: 100
});
```

### Caching Strategy

1. **URL Reputation Cache**: 24-hour TTL for URL analysis results
2. **Dashboard Metrics Cache**: Redis cache with 30-second TTL
3. **Static Assets**: CDN with long cache headers (1 year)
4. **API Response Cache**: ETag-based caching for GET endpoints

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function getCachedUrlAnalysis(url: string) {
  const cached = await redis.get(`url:${url}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function cacheUrlAnalysis(url: string, result: any) {
  await redis.setex(`url:${url}`, 86400, JSON.stringify(result)); // 24 hours
}

async function getCachedDashboardMetrics(userId: string) {
  const cached = await redis.get(`dashboard:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

async function cacheDashboardMetrics(userId: string, metrics: any) {
  await redis.setex(`dashboard:${userId}`, 30, JSON.stringify(metrics)); // 30 seconds
}
```

### Frontend Performance

1. **Code Splitting**: Route-based code splitting with Next.js dynamic imports
2. **Image Optimization**: Next.js Image component with WebP format
3. **Lazy Loading**: Defer loading of non-critical components
4. **Bundle Optimization**: Tree-shaking and minification
5. **Prefetching**: React Query prefetch for predictable navigation

```typescript
// Route-based code splitting
const AdminPanel = dynamic(() => import("@/components/AdminPanel"), {
  loading: () => <Spinner />,
  ssr: false
});

// Image optimization
import Image from "next/image";

<Image 
  src="/logo.png" 
  alt="CyberShield Logo"
  width={200}
  height={50}
  priority
/>

// Lazy loading with React Query
const { data } = useQuery({
  queryKey: ["scanResults", jobId],
  queryFn: () => fetchScanResults(jobId),
  staleTime: 5000,
  refetchInterval: (data) => data?.status === "completed" ? false : 2000
});
```

## Monitoring and Logging

### Logging Strategy

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log levels: error, warn, info, http, debug

// Example usage
logger.info("User authenticated", { userId, role });
logger.error("Database connection failed", { error: err.message });
logger.warn("Rate limit approaching", { userId, endpoint, count });
```

### Health Check Endpoints

```typescript
// Backend health check
app.get("/health", async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    const containerHealth = await checkMicroserviceHealth();
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        microservices: containerHealth
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message
    });
  }
});
```

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cybershield
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://admin:dev_password@postgres:5432/cybershield
      REDIS_URL: redis://redis:6379
      JWT_ACCESS_SECRET: dev_access_secret
      JWT_REFRESH_SECRET: dev_refresh_secret
    volumes:
      - ./packages/backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend

  scanner-port:
    build:
      context: ./services/port-scanner
      dockerfile: Dockerfile
    ports:
      - "5001:5000"
    environment:
      BACKEND_URL: http://backend:4000
    privileged: true

  scanner-vuln:
    build:
      context: ./services/vuln-scanner
      dockerfile: Dockerfile
    ports:
      - "5002:5000"
    environment:
      BACKEND_URL: http://backend:4000

volumes:
  postgres_data:
```

### Production Environment

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    networks:
      - backend

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - backend

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
    restart: always
    networks:
      - backend
      - frontend
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "80:3000"
      - "443:3000"
    restart: always
    networks:
      - frontend
    depends_on:
      - backend

  scanner-port:
    build:
      context: ./services/port-scanner
      dockerfile: Dockerfile
    environment:
      BACKEND_URL: ${BACKEND_INTERNAL_URL}
    restart: always
    privileged: true
    networks:
      - backend
    deploy:
      replicas: 2

  scanner-vuln:
    build:
      context: ./services/vuln-scanner
      dockerfile: Dockerfile
    environment:
      BACKEND_URL: ${BACKEND_INTERNAL_URL}
    restart: always
    networks:
      - backend
    deploy:
      replicas: 2

volumes:
  postgres_data:

networks:
  frontend:
  backend:
```

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/cybershield

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# API Configuration
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
BACKEND_INTERNAL_URL=http://backend:4000

# Node Environment
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Rate Limiting (optional overrides)
AUTH_RATE_LIMIT=5
PORT_SCAN_RATE_LIMIT=10
VULN_SCAN_RATE_LIMIT=5

# File Upload
MAX_FILE_SIZE=104857600  # 100MB in bytes

# Report Retention
REPORT_RETENTION_DAYS=90

# Audit Log Retention
AUDIT_LOG_RETENTION_DAYS=365
```

## Testing Strategy

### Unit Testing

- **Backend**: Jest + Supertest for API testing
- **Frontend**: Jest + React Testing Library
- **Coverage Target**: 80% code coverage

### Integration Testing

- **Database Integration**: Test database operations with test database
- **API Integration**: Test full request/response cycles
- **Microservice Integration**: Test communication between services

### End-to-End Testing

- **Framework**: Playwright
- **Scenarios**: Critical user workflows (login, scan execution, report generation)

### Property-Based Testing

- **Framework**: fast-check (TypeScript)
- **Focus**: Universal properties across all inputs
- **Minimum**: 100 iterations per property test

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 150 acceptance criteria, the following redundancies were identified and resolved:

1. **JWT Token Generation**: Requirements 1.2 and 1.3 both test JWT generation with different expiry times - combined into a single property that validates both token types
2. **Scan Job Creation**: Requirements 4.3 and 5.2 both test job creation patterns - combined into a single property for all scan types
3. **Input Validation**: Requirements 4.1 and 5.1 both test network target validation - combined into a single property
4. **Password Classification**: Requirements 6.3, 6.4, and 6.5 test classification ranges - combined into a single comprehensive property
5. **Rate Limiting**: Multiple rate limiting requirements (4.10, 5.10, 8.9, 9.8) follow the same pattern - combined into a generic rate limiting property
6. **Result Structure**: Requirements for result field presence (4.6, 5.6, 5.7) - combined into properties that validate complete result structures
7. **Audit Logging**: Requirements 11.1-11.4 all test audit log creation - combined into a single property that any auditable action creates a log entry


### Property 1: JWT Token Generation and Expiration

*For any* valid user credentials, the authentication system SHALL generate both an access token with 15-minute expiration and a refresh token with 7-day expiration, where both tokens can be successfully validated and contain the correct user information.

**Validates: Requirements 1.2, 1.3**

### Property 2: Token Refresh Cycle

*For any* valid refresh token paired with an expired access token, the authentication system SHALL issue a new valid access token without requiring re-authentication.

**Validates: Requirements 1.4**

### Property 3: Logout Invalidates Refresh Token

*For any* authenticated user session, when logout is performed, the refresh token SHALL become invalid and cannot be used to generate new access tokens.

**Validates: Requirements 1.5**

### Property 4: Invalid Credentials Timing

*For any* invalid credential combination, the authentication system SHALL return an authentication error within 200ms.

**Validates: Requirements 1.6**

### Property 5: JWT Validation

*For any* JWT token (valid, invalid, or expired), the validation process SHALL correctly verify the signature and expiration time and return the appropriate result.

**Validates: Requirements 1.8**

### Property 6: User Role Assignment

*For any* user creation request, the system SHALL assign exactly one role from the set {Admin, Security_Analyst, Student}.

**Validates: Requirements 2.2**

### Property 7: Admin Authorization

*For any* user management operation, when requested by a user with Admin role, the system SHALL permit the action.

**Validates: Requirements 2.3**

### Property 8: Non-Admin Denial

*For any* user management operation, when requested by a user with Security_Analyst or Student role, the system SHALL deny the action with 403 status.

**Validates: Requirements 2.4**

### Property 9: Student Write Denial

*For any* write operation on security tools, when requested by a user with Student role, the system SHALL deny the action with 403 status.

**Validates: Requirements 2.5**

### Property 10: Student Read Permission

*For any* read operation on security tools, when requested by a user with Student role, the system SHALL permit the action.

**Validates: Requirements 2.6**

### Property 11: Unauthorized Access Returns 403

*For any* protected endpoint accessed without proper authorization, the system SHALL return a 403 Forbidden status code.

**Validates: Requirements 2.8**

### Property 12: Scan Count Accuracy

*For any* set of scan jobs with timestamps, the dashboard SHALL accurately count the scans performed in the last 30 days.

**Validates: Requirements 3.1**

### Property 13: Active Job Count Accuracy

*For any* set of scan jobs with various statuses, the dashboard SHALL accurately count jobs with status "pending" or "running" as active.

**Validates: Requirements 3.2**

### Property 14: Critical Vulnerability Count

*For any* set of vulnerability findings with severity levels and timestamps, the dashboard SHALL accurately count findings with severity "CRITICAL" within the last 30 days.

**Validates: Requirements 3.3**

### Property 15: Recent Scans Display

*For any* set of scan jobs, the dashboard SHALL return the 5 most recent jobs ordered by timestamp descending with status information.

**Validates: Requirements 3.4**

### Property 16: Student Dashboard Read-Only

*For any* dashboard state accessed by a user with Student role, all interactive widgets SHALL be rendered as read-only.

**Validates: Requirements 3.7**

### Property 17: Network Target Validation

*For any* string input, the port scanner and vulnerability assessment SHALL accept it if and only if it is a valid IPv4 address or fully qualified domain name.

**Validates: Requirements 4.1, 5.1**

### Property 18: Scan Job Creation and Response Time

*For any* valid scan request (port or vulnerability), the system SHALL create a scan job and return a job identifier within 500ms.

**Validates: Requirements 4.3, 5.2**

### Property 19: Scan Result Structure Completeness

*For any* completed port scan, the results SHALL contain port number, state, service name, and service version for each detected port.

**Validates: Requirements 4.6**

### Property 20: Job Status Query Response Time

*For any* scan job identifier, the system SHALL return the current job status within 200ms.

**Validates: Requirements 4.8**

### Property 21: Student Target Restriction

*For any* scan request submitted by a user with Student role, the port scanner SHALL only accept targets within predefined safe ranges and reject all others.

**Validates: Requirements 4.9**

### Property 22: Rate Limit Enforcement

*For any* user and rate-limited endpoint, when the configured limit is reached within the time window, subsequent requests SHALL be denied with 429 status until the window resets.

**Validates: Requirements 4.10, 5.10, 8.9, 9.8, 15.1**

### Property 23: Vulnerability Severity Classification

*For any* detected vulnerability, the system SHALL classify its severity as exactly one of {Critical, High, Medium, Low, Informational}.

**Validates: Requirements 5.5**

### Property 24: Vulnerability Result Completeness

*For any* detected vulnerability, the results SHALL contain CVE identifier, severity classification, and remediation recommendation.

**Validates: Requirements 5.6, 5.7**

### Property 25: Student Result Sanitization

*For any* vulnerability assessment results retrieved by a user with Student role, the system SHALL remove or redact sensitive infrastructure details.

**Validates: Requirements 5.9**

### Property 26: Password Strength Scoring

*For any* password string, the password analyzer SHALL calculate a strength score between 0 and 100 inclusive.

**Validates: Requirements 6.1**

### Property 27: Password Strength Classification

*For any* password with a calculated score, the password analyzer SHALL classify it as "Weak" (score < 50), "Moderate" (50 ≤ score ≤ 75), or "Strong" (score > 75).

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 28: Weak Password Feedback

*For any* password classified as "Weak", the password analyzer SHALL provide specific feedback describing the weaknesses.

**Validates: Requirements 6.6**

### Property 29: Password Generation Length

*For any* password generation request with length parameter between 8 and 128, the generated password SHALL have exactly the requested length.

**Validates: Requirements 6.7**

### Property 30: Password Generation Character Sets

*For any* password generation request with specified character set configuration, the generated password SHALL contain only characters from the requested sets and include at least one character from each requested set.

**Validates: Requirements 6.8**

### Property 31: Password Analysis Performance

*For any* password string, the password analyzer SHALL complete the analysis within 100ms.

**Validates: Requirements 6.10**

### Property 32: Hash Generation Performance

*For any* text input up to 1MB, the hash generator SHALL generate all four hashes (MD5, SHA1, SHA256, SHA512) within 50ms.

**Validates: Requirements 7.2**

### Property 33: Hash Output Format

*For any* text input, all generated hashes SHALL be valid hexadecimal strings.

**Validates: Requirements 7.4**

### Property 34: Hash Result Metadata

*For any* hash generation, the results SHALL include algorithm name and hash length for each of the four algorithms.

**Validates: Requirements 7.8**

### Property 35: File Hash Computation Performance

*For any* file up to 100MB, the file integrity checker SHALL compute the SHA256 hash within 2 seconds.

**Validates: Requirements 8.1**

### Property 36: File Integrity Verification Match

*For any* file and stored hash pair where the computed hash matches the stored hash, the file integrity checker SHALL indicate verification success.

**Validates: Requirements 8.4**

### Property 37: File Integrity Verification Mismatch

*For any* file and stored hash pair where the computed hash differs from the stored hash, the file integrity checker SHALL indicate the file has been modified.

**Validates: Requirements 8.5**

### Property 38: File Metadata Display

*For any* file integrity check, the results SHALL display filename, file size, upload timestamp, and hash value.

**Validates: Requirements 8.7**

### Property 39: Student File Size Limit

*For any* file upload by a user with Student role, the file integrity checker SHALL reject files larger than 10MB.

**Validates: Requirements 8.8**

### Property 40: URL Format Validation Performance

*For any* submitted URL string, the URL reputation analyzer SHALL validate the format within 50ms.

**Validates: Requirements 9.1**

### Property 41: URL Analysis Completeness

*For any* URL analysis, the results SHALL include domain age analysis, SSL certificate validity check, and blocklist presence check.

**Validates: Requirements 9.2**

### Property 42: URL Reputation Classification

*For any* analyzed URL, the reputation analyzer SHALL classify it as exactly one of {Safe, Suspicious, Malicious}.

**Validates: Requirements 9.3**

### Property 43: URL Risk Indicators

*For any* URL analysis, the results SHALL provide risk indicators including domain registration date, SSL status, and blocklist match status.

**Validates: Requirements 9.4**

### Property 44: Malicious URL Threat Indicators

*For any* URL classified as "Malicious", the results SHALL display specific threat indicators explaining the classification.

**Validates: Requirements 9.5**

### Property 45: URL Analysis Caching

*For any* URL analyzed within the last 24 hours, when the same URL is submitted again, the system SHALL return the cached results without performing a new analysis.

**Validates: Requirements 9.7**

### Property 46: URL Analysis Performance

*For any* URL submission, the reputation analyzer SHALL complete the analysis within 3 seconds.

**Validates: Requirements 9.9**

### Property 47: Report Content Completeness

*For any* report generation request, the generated report SHALL include all selected scan results, vulnerability findings, and timestamps.

**Validates: Requirements 10.2**

### Property 48: Report Job Selection

*For any* report generation request with specified job IDs, the report SHALL include only the selected jobs and exclude all others.

**Validates: Requirements 10.3**

### Property 49: PDF Report Structure

*For any* PDF report generation, the report SHALL include executive summary, detailed findings, and severity distribution charts.

**Validates: Requirements 10.4**

### Property 50: CSV Report Format

*For any* CSV report generation, the report SHALL be in valid tabular format with all scan details included.

**Validates: Requirements 10.5**

### Property 51: Report Generation Performance

*For any* report containing up to 1000 findings, the system SHALL complete generation within 10 seconds.

**Validates: Requirements 10.6**

### Property 52: Report Metadata Inclusion

*For any* generated report, it SHALL include user information, generation timestamp, and platform branding.

**Validates: Requirements 10.7**

### Property 53: Student Report Watermark

*For any* report generated by a user with Student role, the report SHALL contain an "Educational Use Only" watermark.

**Validates: Requirements 10.8**

### Property 54: Audit Log Creation for Events

*For any* security-relevant action (authentication attempt, tool execution, user management action, or configuration change), the system SHALL create an audit log entry.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 55: Audit Log Entry Completeness

*For any* audit log entry created, it SHALL record user identifier, action type, timestamp, IP address, and outcome.

**Validates: Requirements 11.5**

### Property 56: Audit Log Query Filtering

*For any* audit log query with filter parameters (user, action type, date range, outcome), the system SHALL return only entries matching all specified filters.

**Validates: Requirements 11.7**

### Property 57: Analyst Audit Log Scope

*For any* audit log query by a user with Security_Analyst role, the system SHALL return only entries associated with that specific user.

**Validates: Requirements 11.9**

### Property 58: Admin User Listing

*For any* request by a user with Admin role, the admin panel SHALL display all registered users with their role and status information.

**Validates: Requirements 12.1**

### Property 59: User Creation Field Validation

*For any* user creation request, the admin panel SHALL require username, email, password, and role fields and reject requests missing any required field.

**Validates: Requirements 12.2**

### Property 60: User Update Field Restrictions

*For any* user update request, the system SHALL allow modification of email, role, and active status fields only.

**Validates: Requirements 12.3**

### Property 61: User Deactivation Session Invalidation

*For any* user deactivation by an admin, the system SHALL invalidate all active sessions (access and refresh tokens) for that user.

**Validates: Requirements 12.4**

### Property 62: Admin Metrics Display

*For any* admin panel state, it SHALL display accurate counts of total users, active sessions, and scan job queue length.

**Validates: Requirements 12.5**

### Property 63: Rate Limit Configuration

*For any* rate limit configuration change by an admin, the new limits SHALL be applied to subsequent requests for the affected security tool.

**Validates: Requirements 12.6**

### Property 64: Admin Action Audit Logging

*For any* user management action performed by an admin, the system SHALL create an audit log entry recording the action.

**Validates: Requirements 12.8**

### Property 65: Password Complexity Enforcement

*For any* password in user creation or update requests, the system SHALL enforce minimum complexity of 8 characters with mixed case and numbers.

**Validates: Requirements 12.9**

### Property 66: AI Vulnerability Remediation

*For any* vulnerability finding displayed to a user, the AI assistant SHALL provide remediation recommendations based on CVE data.

**Validates: Requirements 13.2**

### Property 67: AI Port Risk Identification

*For any* port scan results displayed to a user, the AI assistant SHALL identify potentially risky open services.

**Validates: Requirements 13.3**

### Property 68: AI Password Improvement Suggestions

*For any* weak password analysis result, the AI assistant SHALL suggest specific improvements.

**Validates: Requirements 13.4**

### Property 69: AI Context-Aware Guidance

*For any* active security tool context, the AI assistant SHALL provide guidance specific to that tool.

**Validates: Requirements 13.5**

### Property 70: AI Role-Based Recommendations

*For any* user request for general security guidance, the AI assistant SHALL provide recommendations tailored to the user's role and recent scan history.

**Validates: Requirements 13.7**

### Property 71: AI Response Performance

*For any* AI assistant query, the system SHALL respond within 500ms.

**Validates: Requirements 13.8**

### Property 72: AI Interaction Audit Logging

*For any* interaction with the AI assistant, the system SHALL create an audit log entry.

**Validates: Requirements 13.9**

### Property 73: AI Proactive Severity Alerts

*For any* scan results where findings exceed configured severity thresholds, the AI assistant SHALL proactively display alerts and recommendations without user prompt.

**Validates: Requirements 13.10**

### Property 74: Input Validation and Sanitization

*For any* user input submitted to any endpoint, the system SHALL validate format and sanitize content before processing to prevent injection attacks.

**Validates: Requirements 15.2**

### Property 75: Non-Scanning Operation Performance

*For any* authenticated request to non-scanning endpoints, the backend SHALL respond within 500ms.

**Validates: Requirements 15.7**

### Property 76: Database Failure Error Handling

*For any* request when the database connection is unavailable, the backend SHALL return a 503 Service Unavailable status.

**Validates: Requirements 15.8**

### Property 77: Microservice Operation Timeout

*For any* security microservice operation, the system SHALL implement a 30-second timeout and handle timeout scenarios appropriately.

**Validates: Requirements 15.9**

### Property 78: Error Logging with Severity

*For any* error condition encountered in the system, the error SHALL be logged with an appropriate severity level (error, warn, info).

**Validates: Requirements 15.10**

## Monorepo Structure

```
cybershield/
├── packages/
│   ├── frontend/                # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities
│   │   │   ├── stores/         # Zustand stores
│   │   │   └── types/          # TypeScript types
│   │   ├── public/             # Static assets
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── backend/                 # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Route controllers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Data access
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── utils/          # Utilities
│   │   │   ├── types/          # TypeScript types
│   │   │   └── index.ts        # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Prisma schema
│   │   │   └── migrations/     # Database migrations
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                  # Shared code
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   ├── constants/      # Shared constants
│       │   └── utils/          # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   ├── port-scanner/            # Python port scanner
│   │   ├── src/
│   │   │   ├── api.py          # FastAPI application
│   │   │   ├── scanner.py      # Nmap integration
│   │   │   └── models.py       # Data models
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── vuln-scanner/            # Python vulnerability scanner
│       ├── src/
│       │   ├── api.py          # FastAPI application
│       │   ├── scanner.py      # Vulnerability scanning
│       │   ├── cve.py          # CVE database
│       │   └── models.py       # Data models
│       ├── requirements.txt
│       └── Dockerfile
│
├── docker-compose.yml           # Docker Compose for development
├── docker-compose.prod.yml      # Docker Compose for production
├── package.json                 # Root package.json (workspace config)
├── pnpm-workspace.yaml          # PNPM workspace config
├── turbo.json                   # Turborepo config (optional)
├── .gitignore
└── README.md
```

## Implementation Notes

### Development Workflow

1. Install dependencies: `pnpm install`
2. Generate Prisma client: `cd packages/backend && pnpm prisma generate`
3. Run database migrations: `pnpm prisma migrate dev`
4. Start development environment: `docker-compose up`
5. Frontend available at: `http://localhost:3000`
6. Backend API at: `http://localhost:4000`

### Database Migrations

```bash
# Create new migration
cd packages/backend
pnpm prisma migrate dev --name add_new_feature

# Apply migrations to production
pnpm prisma migrate deploy

# Reset database (development only)
pnpm prisma migrate reset
```

### Testing Commands

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:coverage

# Run property-based tests
pnpm test:properties
```

### Build and Deployment

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @cybershield/frontend build
pnpm --filter @cybershield/backend build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f scanner-port
```

## Security Considerations

1. **Secrets Management**: Never commit secrets to version control. Use environment variables and .env files (gitignored)
2. **Database Encryption**: Enable encryption at rest for PostgreSQL in production
3. **HTTPS**: Always use HTTPS in production with valid SSL certificates
4. **Container Security**: Regularly update base images and scan for vulnerabilities
5. **Input Validation**: Validate and sanitize all inputs before processing
6. **Rate Limiting**: Enforce strict rate limits to prevent abuse
7. **Audit Logging**: Log all security-relevant actions with immutable records
8. **Password Security**: Use bcrypt with appropriate salt rounds (12+)
9. **Token Security**: Store refresh tokens securely, invalidate on logout
10. **CORS**: Restrict origins to known frontend URLs only

## Conclusion

This technical design provides a comprehensive blueprint for building the CyberShield Security Toolkit. The architecture emphasizes security, scalability, and maintainability through clear separation of concerns, comprehensive error handling, and robust testing strategies. The monorepo structure enables code sharing and consistent development practices across all services, while containerization ensures consistent deployment environments from development to production.
