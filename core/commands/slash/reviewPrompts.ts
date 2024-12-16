// Common configuration for all review prompts
const REVIEW_CONFIG = `temperature: 0.0
---`;

// Base review template that all specific review prompts will extend
const BASE_REVIEW_TEMPLATE = `{{{ diff }}}

Review the changes above focusing on the following key areas:

### Critical Checks
- Debug artifacts (console.logs, commented code, TODOs)
- Code duplication and opportunities for reuse
- Edge cases and error handling
- Refactoring opportunities (complexity, readability)

### Code Quality
- Clean code principles and readability
- Naming conventions and consistency
- Proper abstraction and modularity
- Code organization and structure

### Best Practices
- Language-specific idioms and patterns
- Framework and library usage
- Performance considerations
- Security implications

For each file changed, provide a structured review with:
1. ✅/❌ Status indicator and filename
2. Summary of changes
3. Issues found (if any):
   - Description of the problem
   - Impact and risks
   - Current code:
     \`\`\`language
     [problematic code]
     \`\`\`
   - Suggested fix:
     \`\`\`language
     [improved code]
     \`\`\`
4. Positive aspects worth highlighting

Example format:
### ✅ filename.ts
Brief summary of what changed

### ❌ filename.ts
Brief summary of what changed

#### Issue 1: Leftover debug code
**Problem**: Debug statements left in production code
**Impact**: Unnecessary logging in production environment

**Current Code**:
\`\`\`ts
function process() {
  console.log("debug info");
  return data;
}
\`\`\`

**Suggested Solution**:
\`\`\`ts
function process() {
  return data;
}
\`\`\`

#### Issue 2: Repeated validation logic
**Problem**: Duplicate validation code
**Impact**: Maintenance burden and potential inconsistencies

**Current Code**:
\`\`\`ts
if (!user.name || user.name.trim() === "") { /* validation 1 */ }
if (!user.email || user.email.trim() === "") { /* validation 2 */ }
\`\`\`

**Suggested Solution**:
\`\`\`ts
const validateField = (field: string) => field && field.trim() !== "";
if (!validateField(user.name)) { /* validation 1 */ }
if (!validateField(user.email)) { /* validation 2 */ }
\`\`\`

#### Issue 3: Missing null check
**Problem**: Potential null reference
**Impact**: Runtime errors if object is null/undefined

**Current Code**:
\`\`\`ts
const value = obj.nested.value;
\`\`\`

**Suggested Solution**:
\`\`\`ts
const value = obj?.nested?.value;
\`\`\`

- Issue: Repeated validation logic
  Impact: Maintenance burden, potential inconsistencies
  Current code:
  \`\`\`ts
  if (!user.name || user.name.trim() === '') { /* validation 1 */ }
  if (!user.email || user.email.trim() === '') { /* validation 2 */ }
  \`\`\`
  Suggested fix:
  \`\`\`ts
  const validateField = (field: string) => field && field.trim() !== '';
  if (!validateField(user.name)) { /* validation 1 */ }
  if (!validateField(user.email)) { /* validation 2 */ }
  \`\`\`

- Issue: Missing null check
  Impact: Potential runtime errors
  Current code:
  \`\`\`ts
  const value = obj.nested.value;
  \`\`\`
  Suggested fix:
  \`\`\`ts
  const value = obj?.nested?.value;
  \`\`\``;

export const WORKING_STATE_PROMPT = (diff: string) => `${REVIEW_CONFIG}
${BASE_REVIEW_TEMPLATE}

Additional focus areas:
- Development artifacts (debug statements, TODOs)
- Error handling edge cases
- Test coverage for new changes
- Documentation updates needed`;

export const DIFF_WITH_MAIN_PROMPT = (diffContent: string) => `${REVIEW_CONFIG}
${BASE_REVIEW_TEMPLATE}

Additional focus areas:
- Breaking changes and edge cases
- Dependency updates and conflicts
- Integration test coverage
- Shared code duplication`;

export const LAST_COMMIT_PROMPT = (diffContent: string) => `${REVIEW_CONFIG}
${BASE_REVIEW_TEMPLATE}

Additional focus areas:
- Commit scope and atomicity
- Edge case handling
- Code duplication with existing codebase
- Refactoring opportunities`;
