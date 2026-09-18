const baseUrl = process.env.WORKBENCH_URL ?? "http://localhost:3000"

async function request(path, init) {
  return fetch(`${baseUrl}${path}`, init)
}

const loginPage = await request("/login")
if (loginPage.status !== 200) throw new Error(`Expected /login to return 200, got ${loginPage.status}`)

const unauthenticatedMutation = await request("/api/ai/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "auth smoke", assigned_agent: "research" }),
})
if (unauthenticatedMutation.status !== 401) {
  throw new Error(`Expected unauthenticated mutation to return 401, got ${unauthenticatedMutation.status}`)
}

const session = await request("/api/auth/session")
if (session.status !== 200) throw new Error(`Expected session endpoint to return 200, got ${session.status}`)

const invalidLogin = await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "unknown@example.com", password: "invalid" }),
})
const expectedInvalidLoginStatus = process.env.DATABASE_URL ? 401 : 503
if (invalidLogin.status !== expectedInvalidLoginStatus) {
  throw new Error(`Expected invalid login to return ${expectedInvalidLoginStatus}, got ${invalidLogin.status}`)
}

console.log("Auth smoke checks passed: login page, protected mutation, session endpoint, invalid-login boundary")