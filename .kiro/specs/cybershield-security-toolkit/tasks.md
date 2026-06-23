# Implementation Plan: CyberShield Security Toolkit

## Overview

This implementation plan breaks down the CyberShield Security Toolkit into discrete, incremental coding tasks. The platform is a comprehensive cybersecurity platform with a Next.js frontend, Node.js/Express backend, PostgreSQL database, and Python microservices for security scanning. The implementation follows a layered approach: foundational infrastructure → core authentication → database layer → security tools → UI components → integration and testing.

The platform implements 78 correctness properties across 15 major functional areas, with comprehensive property-based testing for universal behaviors and unit tests for specific scenarios.

## Tasks

### Phase 1: Project Setup and Infrastructure

- [x] 1. Initialize monorepo structure with workspace management
  - Create root directory with packages/ and services/ folders
  - Set up pnpm workspace configuration in pnpm-workspace.yaml
  - Initialize root package.json with workspace scripts
  - Create .gitignore with Node.js, Python, and environment exclusions
  - _Requirements: 14.1_

- [ ] 2. Set up shared package with TypeScript types and constants
  - [-] 2.1 Create packages/shared directory structure
    - Initialize TypeScript configuration with strict mode
    - Define shared types: UserProfile, Role, ScanType, JobStatus, etc.
    - Define API response interfaces and error codes
    - Create constants file for rate limits, timeouts, and configurations
    - _Requirements: 14.1_

### Phase 2: Backend API Foundation

- [ ] 3. Initialize backend Node.js/Express application
  - [~] 3.1 Set up Express server with TypeScript
    - Create packages/backend directory structure
    - Initialize Express with TypeScript, configure port and environment
    - Set up layered architecture: controllers/, services/, repositories/, middleware/
    - Install dependencies: express, typescript, @types/node, @types/express
    - Create entry point (src/index.ts) with basic server startup
    - _Requirements: 14.1, 14.7_
  
  - [~] 3.2 Configure security middleware stack
    - Install and configure Helmet for security headers
    - Set up CORS with origin whitelist for frontend
    - Implement request logging middleware
    - Add body parser with size limits
    - _Requirements: 14.8, 14.9, 15.3_
  
  - [ ]* 3.3 Write unit tests for server initialization
    - Test server starts on configured port
    - Test middleware stack is properly ordered
    - Test CORS policies reject unauthorized origins
    - _Requirements: 14.8_

- [ ] 4. Set up PostgreSQL database with Prisma ORM
  - [~] 4.1 Initialize Prisma and define database schema
    - Create packages/backend/prisma directory
    - Define Prisma schema with all models: User, RefreshToken, ScanJob, FileHash, UrlAnalysis, Report, AuditLog, RateLimit
    - Configure PostgreSQL connection in schema.prisma
    - Add UUIDs, indexes, and cascading deletes
    - _Requirements: 14.5_
  
  - [~] 4.2 Create database migration and seed scripts
    - Generate initial Prisma migration
    - Create seed script for default admin user and rate limits
    - Test database connection and migration application
    - _Requirements: 14.5_

### Phase 3: Authentication System

- [ ] 5. Implement password hashing and validation
  - [~] 5.1 Create password utility functions
    - Install bcrypt dependency
    - Implement hashPassword function with 12 salt rounds
    - Implement verifyPassword function with timing-safe comparison
    - Implement validatePasswordComplexity (min 8 chars, mixed case, numbers)
    - _Requirements: 1.1, 12.9_
  
  - [ ]* 5.2 Write property tests for password hashing
    - **Property 65: Password Complexity Enforcement**
    - **Validates: Requirements 12.9**
    - Test any password meeting complexity requirements is accepted
    - Test any password failing complexity requirements is rejected
    - _Requirements: 12.9_

- [ ] 6. Implement JWT token generation and validation
  - [~] 6.1 Create JWT service module
    - Install jsonwebtoken and @types/jsonwebtoken
    - Implement generateAccessToken (15-minute expiry) with user ID and role payload
    - Implement generateRefreshToken with cryptographically secure random bytes
    - Implement verifyAccessToken with signature and expiration checks
    - Implement verifyRefreshToken with database lookup
    - _Requirements: 1.2, 1.3, 1.8_
  
  - [ ]* 6.2 Write property tests for JWT token management
    - **Property 1: JWT Token Generation and Expiration**
    - **Validates: Requirements 1.2, 1.3**
    - **Property 5: JWT Validation**
    - **Validates: Requirements 1.8**
    - _Requirements: 1.2, 1.3, 1.8_

- [ ] 7. Create authentication repository layer
  - [~] 7.1 Implement user and token repository functions
    - Create repositories/userRepository.ts with Prisma queries
    - Implement createUser, findUserByEmail, findUserById
    - Implement storeRefreshToken, findRefreshToken, invalidateRefreshToken
    - Implement invalidateUserTokens (for logout and deactivation)
    - _Requirements: 1.7_

- [ ] 8. Implement authentication service layer
  - [~] 8.1 Create authentication business logic
    - Create services/authService.ts
    - Implement register (hash password, create user, validate complexity)
    - Implement login (verify credentials, generate tokens, store refresh token)
    - Implement refresh (validate refresh token, issue new access token)
    - Implement logout (invalidate refresh token)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 8.2 Write property tests for authentication flows
    - **Property 2: Token Refresh Cycle**
    - **Validates: Requirements 1.4**
    - **Property 3: Logout Invalidates Refresh Token**
    - **Validates: Requirements 1.5**
    - **Property 4: Invalid Credentials Timing**
    - **Validates: Requirements 1.6**
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 9. Create authentication controller and routes
  - [~] 9.1 Implement authentication endpoints
    - Create controllers/authController.ts
    - Implement POST /api/auth/register endpoint with validation
    - Implement POST /api/auth/login endpoint with rate limiting (5 requests/15 min)
    - Implement POST /api/auth/refresh endpoint
    - Implement POST /api/auth/logout endpoint
    - Wire controllers to Express routes
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

### Phase 4: Authorization and Access Control

- [ ] 10. Implement role-based access control middleware
  - [~] 10.1 Create authentication and authorization middleware
    - Create middleware/authMiddleware.ts
    - Implement authenticateToken middleware (extract and verify JWT)
    - Implement requireRole middleware factory for role checks
    - Implement requireAdmin, requireAnalyst helper middleware
    - Add user context to request object
    - _Requirements: 2.1, 2.7_
  
  - [ ]* 10.2 Write property tests for RBAC
    - **Property 6: User Role Assignment**
    - **Validates: Requirements 2.2**
    - **Property 7: Admin Authorization**
    - **Validates: Requirements 2.3**
    - **Property 8: Non-Admin Denial**
    - **Validates: Requirements 2.4**
    - **Property 9: Student Write Denial**
    - **Validates: Requirements 2.5**
    - **Property 10: Student Read Permission**
    - **Validates: Requirements 2.6**
    - **Property 11: Unauthorized Access Returns 403**
    - **Validates: Requirements 2.8**
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_

### Phase 5: Audit Logging System

- [ ] 11. Implement audit logging infrastructure
  - [~] 11.1 Create audit log repository and service
    - Create repositories/auditRepository.ts with Prisma insert operations
    - Create services/auditService.ts with logEvent function
    - Implement createAuditLog (userId, action, actionType, ipAddress, outcome, metadata)
    - Implement queryAuditLogs with filtering (userId, actionType, dateRange, outcome)
    - Ensure immutability (no update/delete operations)
    - _Requirements: 11.5, 11.6, 11.7, 11.10_
  
  - [~] 11.2 Create audit logging middleware
    - Create middleware/auditMiddleware.ts
    - Implement automatic audit log capture for protected endpoints
    - Extract IP address, user context, and action details
    - Log authentication attempts, tool executions, user management, config changes
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ]* 11.3 Write property tests for audit logging
    - **Property 54: Audit Log Creation for Events**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
    - **Property 55: Audit Log Entry Completeness**
    - **Validates: Requirements 11.5**
    - **Property 56: Audit Log Query Filtering**
    - **Validates: Requirements 11.7**
    - **Property 57: Analyst Audit Log Scope**
    - **Validates: Requirements 11.9**
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.9_

- [~] 12. Checkpoint - Verify authentication and authorization
  - Test user registration, login, token refresh, and logout
  - Verify role-based access control blocks unauthorized requests
  - Verify audit logs are created for authentication events
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Rate Limiting System

- [ ] 13. Implement configurable rate limiting
  - [~] 13.1 Create rate limit service and middleware
    - Install express-rate-limit
    - Create services/rateLimitService.ts with database-backed rate limit configuration
    - Implement getRateLimit(tool) to fetch limits from database
    - Create middleware/rateLimitMiddleware.ts
    - Implement createRateLimiter factory function with per-user keying
    - Create specific limiters: authLimiter, portScanLimiter, vulnScanLimiter, fileCheckLimiter, urlAnalysisLimiter
    - _Requirements: 4.10, 5.10, 8.9, 9.8, 15.1_
  
  - [ ]* 13.2 Write property tests for rate limiting
    - **Property 22: Rate Limit Enforcement**
    - **Validates: Requirements 4.10, 5.10, 8.9, 9.8, 15.1**
    - _Requirements: 4.10, 5.10, 8.9, 9.8, 15.1_

### Phase 7: Python Security Microservices

- [ ] 14. Create port scanner microservice
  - [~] 14.1 Set up Python FastAPI application for port scanning
    - Create services/port-scanner directory structure
    - Initialize FastAPI application with Python 3.11+
    - Install dependencies: fastapi, uvicorn, python-nmap
    - Create models.py with Pydantic models for requests/responses
    - Create scanner.py with Nmap integration
    - Implement execute_port_scan with scan type mapping (TCP_CONNECT, SYN_STEALTH, UDP, COMPREHENSIVE)
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [~] 14.2 Implement port scanner API endpoints
    - Create api.py with FastAPI routes
    - Implement POST /scan/port endpoint (accept jobId, target, scanType, ports)
    - Implement GET /scan/port/{jobId} endpoint for status and results
    - Implement GET /health endpoint
    - Add async job queue using asyncio or Celery
    - Implement callback to backend API on scan completion
    - _Requirements: 4.3, 4.4, 4.6, 14.3_
  
  - [~] 14.3 Create Dockerfile for port scanner
    - Create Dockerfile with Python 3.11 base image
    - Install Nmap system package
    - Copy requirements and source code
    - Expose port 8001
    - Configure entry point with uvicorn
    - _Requirements: 14.2, 14.3, 14.10_

- [ ] 15. Create vulnerability assessment microservice
  - [~] 15.1 Set up Python FastAPI application for vulnerability scanning
    - Create services/vuln-scanner directory structure
    - Initialize FastAPI application
    - Install dependencies: fastapi, uvicorn, requests
    - Create models.py with Pydantic models
    - Create cve.py for CVE database integration
    - Implement CVE matching with severity classification (CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL)
    - _Requirements: 5.4, 5.5_
  
  - [~] 15.2 Implement vulnerability scanner API endpoints
    - Create api.py with FastAPI routes
    - Implement POST /scan/vulnerability endpoint (accept jobId, target, depth)
    - Implement GET /scan/vulnerability/{jobId} endpoint
    - Implement GET /health endpoint
    - Add vulnerability detection logic with CVE ID, remediation, and references
    - Implement callback to backend API on scan completion
    - _Requirements: 5.2, 5.3, 5.6, 5.7_
  
  - [~] 15.3 Create Dockerfile for vulnerability scanner
    - Create Dockerfile with Python 3.11 base image
    - Install scanning dependencies
    - Copy requirements and source code
    - Expose port 8002
    - Configure entry point with uvicorn
    - _Requirements: 14.2, 14.3, 14.10_
  
  - [ ]* 15.4 Write property tests for scan job creation
    - **Property 17: Network Target Validation**
    - **Validates: Requirements 4.1, 5.1**
    - **Property 18: Scan Job Creation and Response Time**
    - **Validates: Requirements 4.3, 5.2**
    - _Requirements: 4.1, 4.3, 5.1, 5.2_

### Phase 8: Security Tool Implementations

- [ ] 16. Implement password analyzer tool
  - [~] 16.1 Create password analysis service
    - Create services/passwordService.ts
    - Implement analyzePassword function with scoring algorithm (0-100)
    - Evaluate length, character diversity, common patterns, dictionary words
    - Implement strength classification (Weak <50, Moderate 50-75, Strong >75)
    - Provide specific feedback on weaknesses
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [~] 16.2 Implement password generation service
    - Implement generatePassword with configurable length (8-128)
    - Support character set configuration (lowercase, uppercase, numbers, special)
    - Use crypto.randomBytes for cryptographically secure generation
    - Ensure generated password includes at least one character from each requested set
    - _Requirements: 6.7, 6.8, 6.9_
  
  - [~] 16.3 Create password analyzer endpoints
    - Create controllers/passwordController.ts
    - Implement POST /api/tools/password/analyze endpoint
    - Implement POST /api/tools/password/generate endpoint
    - Add input validation with Zod schemas
    - _Requirements: 6.1, 6.7_
  
  - [ ]* 16.4 Write property tests for password analyzer
    - **Property 26: Password Strength Scoring**
    - **Validates: Requirements 6.1**
    - **Property 27: Password Strength Classification**
    - **Validates: Requirements 6.3, 6.4, 6.5**
    - **Property 28: Weak Password Feedback**
    - **Validates: Requirements 6.6**
    - **Property 29: Password Generation Length**
    - **Validates: Requirements 6.7**
    - **Property 30: Password Generation Character Sets**
    - **Validates: Requirements 6.8**
    - **Property 31: Password Analysis Performance**
    - **Validates: Requirements 6.10**
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10_

- [ ] 17. Implement hash generator tool
  - [~] 17.1 Create hash generation service
    - Create services/hashService.ts
    - Use Node.js crypto module
    - Implement generateHashes function for MD5, SHA1, SHA256, SHA512
    - Accept text input up to 1MB
    - Output hashes in hexadecimal format
    - Include algorithm name and hash length in results
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.8_
  
  - [~] 17.2 Create hash generator endpoint
    - Create controllers/hashController.ts
    - Implement POST /api/tools/hash endpoint
    - Add input validation with size limit check
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 17.3 Write property tests for hash generator
    - **Property 32: Hash Generation Performance**
    - **Validates: Requirements 7.2**
    - **Property 33: Hash Output Format**
    - **Validates: Requirements 7.4**
    - **Property 34: Hash Result Metadata**
    - **Validates: Requirements 7.8**
    - _Requirements: 7.2, 7.4, 7.8_

- [ ] 18. Implement file integrity checker tool
  - [~] 18.1 Create file integrity service
    - Create services/fileIntegrityService.ts
    - Implement computeFileHash function with SHA256
    - Implement storeFileHash (filename, size, hash, userId)
    - Implement verifyFileIntegrity (compare computed vs stored hash)
    - Support files up to 100MB (10MB for students)
    - Complete computation within 2 seconds for 100MB files
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8_
  
  - [~] 18.2 Create file integrity endpoints
    - Create controllers/fileIntegrityController.ts
    - Implement POST /api/tools/file/check endpoint with multipart upload
    - Implement POST /api/tools/file/verify endpoint
    - Add file size validation based on user role
    - Apply rate limiting (20 checks per hour)
    - _Requirements: 8.1, 8.3, 8.6, 8.8, 8.9_
  
  - [ ]* 18.3 Write property tests for file integrity checker
    - **Property 35: File Hash Computation Performance**
    - **Validates: Requirements 8.1**
    - **Property 36: File Integrity Verification Match**
    - **Validates: Requirements 8.4**
    - **Property 37: File Integrity Verification Mismatch**
    - **Validates: Requirements 8.5**
    - **Property 38: File Metadata Display**
    - **Validates: Requirements 8.7**
    - **Property 39: Student File Size Limit**
    - **Validates: Requirements 8.8**
    - _Requirements: 8.1, 8.4, 8.5, 8.7, 8.8_

- [ ] 19. Implement URL reputation analyzer tool
  - [~] 19.1 Create URL reputation service
    - Create services/urlReputationService.ts
    - Implement validateUrlFormat function
    - Implement analyzeUrl function with domain age, SSL validity, blocklist checks
    - Classify as Safe, Suspicious, or Malicious
    - Provide risk indicators (registration date, SSL status, blocklist matches)
    - Implement 24-hour caching mechanism
    - Complete analysis within 3 seconds
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.9_
  
  - [~] 19.2 Create URL reputation endpoint
    - Create controllers/urlReputationController.ts
    - Implement POST /api/tools/url/analyze endpoint
    - Add URL validation with Zod schema
    - Check cache before analysis
    - Apply rate limiting (50 analyses per hour)
    - _Requirements: 9.1, 9.6, 9.7, 9.8_
  
  - [ ]* 19.3 Write property tests for URL reputation analyzer
    - **Property 40: URL Format Validation Performance**
    - **Validates: Requirements 9.1**
    - **Property 41: URL Analysis Completeness**
    - **Validates: Requirements 9.2**
    - **Property 42: URL Reputation Classification**
    - **Validates: Requirements 9.3**
    - **Property 43: URL Risk Indicators**
    - **Validates: Requirements 9.4**
    - **Property 44: Malicious URL Threat Indicators**
    - **Validates: Requirements 9.5**
    - **Property 45: URL Analysis Caching**
    - **Validates: Requirements 9.7**
    - **Property 46: URL Analysis Performance**
    - **Validates: Requirements 9.9**
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.9_

- [~] 20. Checkpoint - Verify security tools
  - Test password analyzer with various password strengths
  - Test hash generator with different input sizes
  - Test file integrity checker with file uploads and verifications
  - Test URL reputation analyzer with different URL types
  - Ensure all tests pass, ask the user if questions arise.

### Phase 9: Scan Job Management

- [ ] 21. Implement scan job orchestration
  - [~] 21.1 Create scan job repository and service
    - Create repositories/scanJobRepository.ts
    - Implement createScanJob, updateScanJob, getScanJob, getUserScanJobs
    - Create services/scanJobService.ts
    - Implement job dispatching to Python microservices via HTTP
    - Implement job status polling mechanism
    - Add 30-second timeout for microservice operations
    - _Requirements: 4.3, 4.4, 4.7, 5.2, 5.3, 5.8, 15.9_
  
  - [~] 21.2 Create scan endpoints for port and vulnerability scans
    - Create controllers/scanController.ts
    - Implement POST /api/scans/port endpoint
    - Implement GET /api/scans/port/:jobId endpoint
    - Implement POST /api/scans/vuln endpoint
    - Implement GET /api/scans/vuln/:jobId endpoint
    - Add role-based result filtering for students
    - Apply rate limiting per scan type
    - _Requirements: 4.3, 4.8, 4.9, 5.2, 5.9_
  
  - [ ]* 21.3 Write property tests for scan job management
    - **Property 19: Scan Result Structure Completeness**
    - **Validates: Requirements 4.6**
    - **Property 20: Job Status Query Response Time**
    - **Validates: Requirements 4.8**
    - **Property 21: Student Target Restriction**
    - **Validates: Requirements 4.9**
    - **Property 23: Vulnerability Severity Classification**
    - **Validates: Requirements 5.5**
    - **Property 24: Vulnerability Result Completeness**
    - **Validates: Requirements 5.6, 5.7**
    - **Property 25: Student Result Sanitization**
    - **Validates: Requirements 5.9**
    - _Requirements: 4.6, 4.8, 4.9, 5.5, 5.6, 5.7, 5.9_

### Phase 10: Dashboard and Metrics

- [ ] 22. Implement dashboard metrics service
  - [~] 22.1 Create dashboard service and repository
    - Create services/dashboardService.ts
    - Implement getScansLast30Days (count by timestamp)
    - Implement getActiveJobs (count by status pending/running)
    - Implement getCriticalVulnerabilitiesLast30Days
    - Implement getRecentScans (last 5 jobs with status)
    - Implement getSystemHealth (check backend, database, microservices)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [~] 22.2 Create dashboard endpoints
    - Create controllers/dashboardController.ts
    - Implement GET /api/dashboard/metrics endpoint
    - Implement GET /api/dashboard/health endpoint
    - Add role-based filtering for student users
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_
  
  - [ ]* 22.3 Write property tests for dashboard metrics
    - **Property 12: Scan Count Accuracy**
    - **Validates: Requirements 3.1**
    - **Property 13: Active Job Count Accuracy**
    - **Validates: Requirements 3.2**
    - **Property 14: Critical Vulnerability Count**
    - **Validates: Requirements 3.3**
    - **Property 15: Recent Scans Display**
    - **Validates: Requirements 3.4**
    - **Property 16: Student Dashboard Read-Only**
    - **Validates: Requirements 3.7**
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

### Phase 11: Report Generation

- [ ] 23. Implement report generation service
  - [~] 23.1 Create report service with PDF and CSV generation
    - Install dependencies: pdfkit, csv-writer
    - Create services/reportService.ts
    - Implement generatePdfReport with executive summary, findings, severity charts
    - Implement generateCsvReport with tabular scan details
    - Include user info, timestamp, platform branding
    - Add "Educational Use Only" watermark for student reports
    - Store reports in database with 90-day retention
    - Complete generation within 10 seconds for up to 1000 findings
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_
  
  - [~] 23.2 Create report endpoints
    - Create controllers/reportController.ts
    - Implement POST /api/reports endpoint (generate report)
    - Implement GET /api/reports/:id endpoint (download report)
    - Implement GET /api/reports endpoint (list user reports)
    - Add job ID selection validation
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 23.3 Write property tests for report generation
    - **Property 47: Report Content Completeness**
    - **Validates: Requirements 10.2**
    - **Property 48: Report Job Selection**
    - **Validates: Requirements 10.3**
    - **Property 49: PDF Report Structure**
    - **Validates: Requirements 10.4**
    - **Property 50: CSV Report Format**
    - **Validates: Requirements 10.5**
    - **Property 51: Report Generation Performance**
    - **Validates: Requirements 10.6**
    - **Property 52: Report Metadata Inclusion**
    - **Validates: Requirements 10.7**
    - **Property 53: Student Report Watermark**
    - **Validates: Requirements 10.8**
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

### Phase 12: Admin Panel

- [ ] 24. Implement user management endpoints
  - [~] 24.1 Create user management service
    - Create services/userManagementService.ts
    - Implement getAllUsers, createUser, updateUser, deactivateUser
    - Implement session invalidation on user deactivation
    - Validate required fields (username, email, password, role)
    - Restrict updates to email, role, and active status only
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [~] 24.2 Create user management endpoints
    - Create controllers/userManagementController.ts
    - Implement GET /api/users endpoint (Admin only)
    - Implement POST /api/users endpoint (Admin only)
    - Implement GET /api/users/:id endpoint (Admin only)
    - Implement PATCH /api/users/:id endpoint (Admin only)
    - Implement DELETE /api/users/:id endpoint (Admin only)
    - Add audit logging for all user management actions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.8_
  
  - [ ]* 24.3 Write property tests for user management
    - **Property 58: Admin User Listing**
    - **Validates: Requirements 12.1**
    - **Property 59: User Creation Field Validation**
    - **Validates: Requirements 12.2**
    - **Property 60: User Update Field Restrictions**
    - **Validates: Requirements 12.3**
    - **Property 61: User Deactivation Session Invalidation**
    - **Validates: Requirements 12.4**
    - **Property 64: Admin Action Audit Logging**
    - **Validates: Requirements 12.8**
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.8_

- [ ] 25. Implement admin panel endpoints
  - [~] 25.1 Create admin service and endpoints
    - Create services/adminService.ts
    - Implement getSystemMetrics (total users, active sessions, queue length)
    - Implement updateRateLimits with validation
    - Implement getContainerStatus (query Docker or K8s API)
    - Create controllers/adminController.ts
    - Implement GET /api/admin/metrics endpoint
    - Implement PATCH /api/admin/rate-limits endpoint
    - Implement GET /api/admin/containers endpoint
    - Implement GET /api/audit endpoint with filtering
    - _Requirements: 11.7, 12.5, 12.6, 12.7_
  
  - [ ]* 25.2 Write property tests for admin functionality
    - **Property 62: Admin Metrics Display**
    - **Validates: Requirements 12.5**
    - **Property 63: Rate Limit Configuration**
    - **Validates: Requirements 12.6**
    - _Requirements: 12.5, 12.6_

- [~] 26. Checkpoint - Verify backend API completeness
  - Test all CRUD operations for user management
  - Test dashboard metrics accuracy
  - Test report generation for both PDF and CSV formats
  - Test admin panel endpoints
  - Verify all audit logs are created correctly
  - Ensure all tests pass, ask the user if questions arise.

### Phase 13: AI Security Assistant

- [ ] 27. Implement rule-based AI assistant
  - [~] 27.1 Create rule engine infrastructure
    - Create services/aiAssistantService.ts
    - Define Rule interface with condition, action, priority
    - Define SecurityContext interface with tool, findings, userRole, scanHistory
    - Implement RuleEngine class with addRule and evaluate methods
    - Implement rule priority sorting
    - _Requirements: 13.1_
  
  - [~] 27.2 Create security rules knowledge base
    - Create rules/vulnerabilityRules.ts with CVE-based remediation rules
    - Create rules/portRiskRules.ts for risky port identification (RDP, SMB, Telnet)
    - Create rules/passwordRules.ts for password improvement suggestions
    - Create rules/thresholdRules.ts for severity threshold alerts
    - Create rules/bestPracticeRules.ts for general security guidance
    - _Requirements: 13.2, 13.3, 13.4, 13.6_
  
  - [~] 27.3 Implement AI assistant API integration
    - Create controllers/aiAssistantController.ts
    - Implement context-aware guidance for each security tool
    - Implement role-based recommendations
    - Implement proactive alerts when thresholds are exceeded
    - Add audit logging for all AI interactions
    - Ensure response time under 500ms
    - _Requirements: 13.5, 13.7, 13.8, 13.9, 13.10_
  
  - [ ]* 27.4 Write property tests for AI assistant
    - **Property 66: AI Vulnerability Remediation**
    - **Validates: Requirements 13.2**
    - **Property 67: AI Port Risk Identification**
    - **Validates: Requirements 13.3**
    - **Property 68: AI Password Improvement Suggestions**
    - **Validates: Requirements 13.4**
    - **Property 69: AI Context-Aware Guidance**
    - **Validates: Requirements 13.5**
    - **Property 70: AI Role-Based Recommendations**
    - **Validates: Requirements 13.7**
    - **Property 71: AI Response Performance**
    - **Validates: Requirements 13.8**
    - **Property 72: AI Interaction Audit Logging**
    - **Validates: Requirements 13.9**
    - **Property 73: AI Proactive Severity Alerts**
    - **Validates: Requirements 13.10**
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.7, 13.8, 13.9, 13.10_

### Phase 14: Error Handling and Input Validation

- [ ] 28. Implement comprehensive error handling
  - [~] 28.1 Create error handling infrastructure
    - Create middleware/errorHandler.ts with centralized error middleware
    - Define custom error classes: AuthenticationError, AuthorizationError, ValidationError
    - Implement error logging with severity levels
    - Create ErrorResponse interface with consistent format
    - Map errors to appropriate HTTP status codes and error codes
    - _Requirements: 15.10_
  
  - [~] 28.2 Add input validation middleware
    - Install Zod for schema validation
    - Create validation schemas for all endpoints
    - Implement validation middleware using Zod
    - Add input sanitization to prevent XSS and injection attacks
    - _Requirements: 15.2_
  
  - [ ]* 28.3 Write property tests for error handling
    - **Property 74: Input Validation and Sanitization**
    - **Validates: Requirements 15.2**
    - **Property 75: Non-Scanning Operation Performance**
    - **Validates: Requirements 15.7**
    - **Property 76: Database Failure Error Handling**
    - **Validates: Requirements 15.8**
    - **Property 77: Microservice Operation Timeout**
    - **Validates: Requirements 15.9**
    - **Property 78: Error Logging with Severity**
    - **Validates: Requirements 15.10**
    - _Requirements: 15.2, 15.7, 15.8, 15.9, 15.10_

### Phase 15: Frontend Application

- [ ] 29. Initialize Next.js frontend application
  - [~] 29.1 Set up Next.js 15 with App Router
    - Create packages/frontend directory
    - Initialize Next.js 15 project with TypeScript
    - Install TailwindCSS for styling
    - Install Shadcn/UI component library
    - Install Framer Motion for animations
    - Install React Query for data fetching
    - Configure environment variables for API URL
    - _Requirements: 14.7_
  
  - [~] 29.2 Set up state management and routing
    - Install Zustand for client state
    - Create authentication context with Context API
    - Configure App Router with middleware for authentication checks
    - Create protected route HOC
    - _Requirements: 14.7_

- [ ] 30. Implement authentication UI components
  - [~] 30.1 Create login and registration pages
    - Create app/auth/login/page.tsx with login form
    - Create app/auth/register/page.tsx with registration form
    - Implement form validation with React Hook Form and Zod
    - Add loading states and error messages
    - Store access token in memory, refresh token in HTTP-only cookie
    - _Requirements: 1.2, 1.3_
  
  - [~] 30.2 Implement token management and refresh
    - Create lib/auth.ts with token utilities
    - Implement automatic token refresh logic
    - Create axios interceptor for adding authorization header
    - Implement axios interceptor for handling 401 errors and refreshing tokens
    - _Requirements: 1.4_
  
  - [ ]* 30.3 Write integration tests for authentication flows
    - Test login flow stores tokens correctly
    - Test logout flow clears tokens
    - Test token refresh on access token expiration
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 31. Create dashboard UI
  - [~] 31.1 Create dashboard page and components
    - Create app/dashboard/page.tsx
    - Create components/dashboard/MetricsCard.tsx for scan counts, active jobs, vulnerabilities
    - Create components/dashboard/SystemHealth.tsx for service health indicators
    - Create components/dashboard/RecentScans.tsx for recent scan history
    - Implement React Query for metrics fetching with 30-second auto-refresh
    - Add role-based rendering (read-only widgets for students)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [ ]* 31.2 Write UI component tests for dashboard
    - Test metrics display with mock data
    - Test auto-refresh behavior
    - Test student read-only mode
    - _Requirements: 3.7, 3.8_

- [ ] 32. Create security tools UI components
  - [~] 32.1 Implement port scanner interface
    - Create app/tools/port-scanner/page.tsx
    - Create form for target input, scan type selection, port range
    - Implement job submission and status polling
    - Display scan results in tabular format
    - Add loading states and progress indicators
    - _Requirements: 4.1, 4.2, 4.3, 4.8_
  
  - [~] 32.2 Implement vulnerability assessment interface
    - Create app/tools/vulnerability/page.tsx
    - Create form for target input and depth selection
    - Implement job submission and status polling
    - Display vulnerabilities with severity badges
    - Show CVE IDs and remediation recommendations
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_
  
  - [~] 32.3 Implement password analyzer interface
    - Create app/tools/password/page.tsx
    - Create tabs for password analysis and generation
    - Display strength score with visual gauge
    - Show classification (Weak/Moderate/Strong) with color coding
    - Display specific feedback for weaknesses
    - Implement password generation form with character set options
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [~] 32.4 Implement hash generator interface
    - Create app/tools/hash/page.tsx
    - Create input field with 1MB limit
    - Display all four hashes (MD5, SHA1, SHA256, SHA512) with algorithm names
    - Add copy-to-clipboard button for each hash
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.8_
  
  - [~] 32.5 Implement file integrity checker interface
    - Create app/tools/file-integrity/page.tsx
    - Create tabs for file check and verification
    - Implement file upload with drag-and-drop
    - Display file metadata (name, size, hash, timestamp)
    - Show verification result (verified/modified)
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.7_
  
  - [~] 32.6 Implement URL reputation analyzer interface
    - Create app/tools/url-analyzer/page.tsx
    - Create URL input form with validation
    - Display reputation classification with color coding
    - Show risk indicators (domain age, SSL, blocklist)
    - Display threat indicators for malicious URLs
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [ ] 33. Create report generation UI
  - [~] 33.1 Implement report generator interface
    - Create app/reports/page.tsx
    - Create form for format selection (PDF/CSV)
    - Implement scan job selection with checkboxes
    - Add executive summary toggle for PDF reports
    - Display report list with download links
    - Show generation progress and completion status
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 34. Create admin panel UI
  - [~] 34.1 Implement user management interface
    - Create app/admin/users/page.tsx
    - Display user table with username, email, role, status
    - Implement user creation modal with form validation
    - Implement user edit modal (email, role, active status only)
    - Add user deactivation confirmation dialog
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [~] 34.2 Implement admin dashboard and configuration
    - Create app/admin/dashboard/page.tsx
    - Display system metrics (total users, active sessions, queue length)
    - Create rate limit configuration panel
    - Display container status with health indicators
    - Create audit log viewer with filtering options
    - _Requirements: 11.7, 12.5, 12.6, 12.7_

- [ ] 35. Implement AI assistant UI integration
  - [~] 35.1 Create AI assistant components
    - Create components/AIAssistant.tsx as sidebar or floating widget
    - Implement context-aware guidance display
    - Show recommendations based on active tool
    - Display proactive alerts for high-severity findings
    - Add loading states and smooth transitions
    - _Requirements: 13.5, 13.7, 13.10_
  
  - [ ]* 35.2 Write UI tests for AI assistant
    - Test context switching updates guidance
    - Test alert display on threshold breach
    - Test response time is under 500ms
    - _Requirements: 13.8, 13.10_

- [~] 36. Checkpoint - Verify frontend functionality
  - Test authentication flows (login, logout, token refresh)
  - Test all nine security tools with various inputs
  - Test dashboard metrics display and auto-refresh
  - Test admin panel user management
  - Test report generation and download
  - Verify AI assistant provides contextual guidance
  - Ensure all tests pass, ask the user if questions arise.

### Phase 16: Docker and Deployment Configuration

- [ ] 37. Create Docker configuration files
  - [~] 37.1 Create Dockerfiles for all services
    - Create packages/frontend/Dockerfile for Next.js production build
    - Create packages/backend/Dockerfile for Node.js API
    - Create services/port-scanner/Dockerfile (already implemented in task 14.3)
    - Create services/vuln-scanner/Dockerfile (already implemented in task 15.3)
    - Optimize images with multi-stage builds
    - _Requirements: 14.2, 14.10_
  
  - [~] 37.2 Create Docker Compose configurations
    - Create docker-compose.yml for development environment
    - Create docker-compose.prod.yml for production
    - Configure PostgreSQL service with persistent volumes
    - Configure networking between services
    - Add health checks for all services
    - Configure environment variables
    - _Requirements: 14.2, 14.3, 14.10_

### Phase 17: Integration and End-to-End Testing

- [ ] 38. Implement integration tests
  - [ ]* 38.1 Write backend integration tests
    - Test complete authentication flow from registration to logout
    - Test scan job lifecycle from creation to completion
    - Test report generation with actual scan data
    - Test admin operations with audit log verification
    - Test rate limiting across multiple requests
    - _Requirements: 1.1-1.8, 4.3-4.10, 10.1-10.9, 11.1-11.10_
  
  - [ ]* 38.2 Write microservice integration tests
    - Test port scanner accepts jobs and returns results
    - Test vulnerability scanner with mock CVE database
    - Test timeout handling for long-running scans
    - Test error scenarios and failure modes
    - _Requirements: 4.4, 4.5, 4.6, 5.3, 5.4, 5.5, 5.6, 5.7, 15.9_
  
  - [ ]* 38.3 Write end-to-end tests
    - Test complete user journey from registration to report download
    - Test student user restrictions across all tools
    - Test admin user management operations
    - Test security tool workflows with real microservice calls
    - Test AI assistant recommendations appear correctly
    - _Requirements: 2.5, 2.6, 4.9, 5.9, 8.8, 12.1-12.4, 13.2-13.10_

### Phase 18: Performance Optimization and Security Hardening

- [ ] 39. Implement performance optimizations
  - [~] 39.1 Optimize database queries
    - Add database indexes for frequent queries
    - Implement query result caching with Redis (optional)
    - Optimize scan job queries with pagination
    - Add database connection pooling
    - _Requirements: 15.6, 15.7_
  
  - [~] 39.2 Optimize frontend performance
    - Implement code splitting for tool pages
    - Add image optimization with Next.js Image
    - Implement lazy loading for heavy components
    - Optimize bundle size with tree shaking
    - Verify initial page load under 2 seconds
    - _Requirements: 15.6_

- [ ] 40. Implement security hardening measures
  - [~] 40.1 Add security enhancements
    - Enable HTTPS in production configuration
    - Implement CSRF protection with tokens
    - Configure database encryption at rest
    - Implement secrets management with environment variables
    - Add Content Security Policy headers
    - Implement request size limits
    - _Requirements: 15.3, 15.4, 15.5_
  
  - [ ]* 40.2 Perform security testing
    - Test for XSS vulnerabilities in all input fields
    - Test for SQL injection with malicious inputs
    - Test CORS policies reject unauthorized origins
    - Test rate limiting prevents brute force attacks
    - Verify all passwords are hashed with bcrypt
    - _Requirements: 1.1, 14.8, 15.1, 15.2_

### Phase 19: Documentation and Deployment Preparation

- [ ] 41. Create comprehensive documentation
  - [~] 41.1 Write API documentation
    - Document all REST endpoints with request/response schemas
    - Create Postman collection or OpenAPI spec
    - Document authentication flows
    - Document error codes and responses
    - _Requirements: 14.7_
  
  - [~] 41.2 Write deployment documentation
    - Create README.md with project overview
    - Document environment variables and configuration
    - Write development setup guide
    - Write production deployment guide
    - Document Docker commands for building and running
    - Document database migration procedures
    - _Requirements: 14.1, 14.5_
  
  - [~] 41.3 Write user documentation
    - Create user guide for each security tool
    - Document admin panel features
    - Create troubleshooting guide
    - Document security best practices

- [ ] 42. Final integration and deployment
  - [~] 42.1 Build and test production images
    - Build Docker images for all services
    - Test production deployment with docker-compose.prod.yml
    - Run all tests in production-like environment
    - Verify all services communicate correctly
    - Test database migrations in clean environment
    - _Requirements: 14.2, 14.3, 14.10_
  
  - [~] 42.2 Perform final system verification
    - Verify all 78 correctness properties are validated
    - Run complete test suite (unit, integration, property-based, E2E)
    - Verify performance benchmarks are met
    - Verify security hardening is in place
    - Test with all three user roles (Admin, Security Analyst, Student)
    - _Requirements: All requirements 1.1-15.10_

- [~] 43. Final checkpoint - Complete system validation
  - Verify all features work as specified in requirements
  - Ensure all property-based tests pass
  - Confirm performance requirements are met
  - Validate security measures are properly implemented
  - Test deployment process and verify system health
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the implementation
- Property tests validate universal correctness properties across all inputs
- Unit tests and integration tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → backend → microservices → frontend → integration
- All 78 correctness properties are covered by property-based tests throughout the task list
- Security is prioritized with bcrypt hashing, JWT tokens, rate limiting, input validation, and audit logging
- Performance requirements are validated at each phase with specific timing constraints

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2"] },
    { "id": 4, "tasks": ["5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "7.1"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1"] },
    { "id": 10, "tasks": ["11.2", "11.3"] },
    { "id": 11, "tasks": ["12"] },
    { "id": 12, "tasks": ["13.1"] },
    { "id": 13, "tasks": ["13.2", "14.1", "15.1"] },
    { "id": 14, "tasks": ["14.2", "15.2"] },
    { "id": 15, "tasks": ["14.3", "15.3", "15.4"] },
    { "id": 16, "tasks": ["16.1", "17.1", "18.1", "19.1"] },
    { "id": 17, "tasks": ["16.2", "17.2", "18.2", "19.2"] },
    { "id": 18, "tasks": ["16.3", "17.3", "18.3", "19.3"] },
    { "id": 19, "tasks": ["16.4"] },
    { "id": 20, "tasks": ["20"] },
    { "id": 21, "tasks": ["21.1"] },
    { "id": 22, "tasks": ["21.2", "21.3"] },
    { "id": 23, "tasks": ["22.1"] },
    { "id": 24, "tasks": ["22.2", "22.3"] },
    { "id": 25, "tasks": ["23.1"] },
    { "id": 26, "tasks": ["23.2", "23.3"] },
    { "id": 27, "tasks": ["24.1"] },
    { "id": 28, "tasks": ["24.2", "24.3", "25.1"] },
    { "id": 29, "tasks": ["25.2"] },
    { "id": 30, "tasks": ["26"] },
    { "id": 31, "tasks": ["27.1"] },
    { "id": 32, "tasks": ["27.2"] },
    { "id": 33, "tasks": ["27.3", "27.4"] },
    { "id": 34, "tasks": ["28.1"] },
    { "id": 35, "tasks": ["28.2", "28.3"] },
    { "id": 36, "tasks": ["29.1"] },
    { "id": 37, "tasks": ["29.2", "30.1"] },
    { "id": 38, "tasks": ["30.2", "30.3"] },
    { "id": 39, "tasks": ["31.1"] },
    { "id": 40, "tasks": ["31.2", "32.1"] },
    { "id": 41, "tasks": ["32.2", "32.3"] },
    { "id": 42, "tasks": ["32.4", "32.5", "32.6"] },
    { "id": 43, "tasks": ["33.1"] },
    { "id": 44, "tasks": ["34.1"] },
    { "id": 45, "tasks": ["34.2", "35.1"] },
    { "id": 46, "tasks": ["35.2"] },
    { "id": 47, "tasks": ["36"] },
    { "id": 48, "tasks": ["37.1"] },
    { "id": 49, "tasks": ["37.2"] },
    { "id": 50, "tasks": ["38.1", "38.2"] },
    { "id": 51, "tasks": ["38.3"] },
    { "id": 52, "tasks": ["39.1", "39.2"] },
    { "id": 53, "tasks": ["40.1"] },
    { "id": 54, "tasks": ["40.2"] },
    { "id": 55, "tasks": ["41.1", "41.2", "41.3"] },
    { "id": 56, "tasks": ["42.1"] },
    { "id": 57, "tasks": ["42.2"] },
    { "id": 58, "tasks": ["43"] }
  ]
}
```
