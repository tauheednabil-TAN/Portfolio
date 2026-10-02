import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../server.js";
import { Server } from "http";

describe("Server HTTP API Integration Tests", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    return new Promise<void>((resolve, reject) => {
      // Bind to port 0 to allocate a random free port dynamically
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address && typeof address !== "string") {
          baseUrl = `http://127.0.0.1:${address.port}`;
          resolve();
        } else {
          reject(new Error("Failed to retrieve server address port"));
        }
      });
    });
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it("should respond with health status on GET /api/health", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe("ok");
    expect(data.time).toBeDefined();
  });

  it("should fail authentication on POST /api/auth/login with wrong password", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password-xyz" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json() as any;
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid password");
  });

  it("should authenticate successfully on POST /api/auth/login with configured password", async () => {
    process.env.ADMIN_PASSWORD = "test-secure-password-2026";
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test-secure-password-2026" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
  });

  it("should reject login on POST /api/auth/login with invalid password format", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: 12345 }),
    });
    expect(res.status).toBe(400);
  });

  it("should fetch public parsed CV on GET /api/public/cv", async () => {
    const res = await fetch(`${baseUrl}/api/public/cv`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.name).toContain("Tauheed");
    expect(data.title).toBeDefined();
    expect(data.skills).toBeDefined();
  });

  it("should return settings on GET /api/settings", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.timezone).toBeDefined();
    expect(data.myEmail).toBe("tauheednabil@gmail.com");
  });

  it("should return roadmap on GET /api/roadmap", async () => {
    const res = await fetch(`${baseUrl}/api/roadmap`);
    expect(res.status).toBe(200);
    const data = await res.json() as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].title).toBeDefined();
  });

  it("should return 401 when permanent avatar is uploaded without admin auth", async () => {
    const res = await fetch(`${baseUrl}/api/save-permanent-avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
    const data = await res.json() as any;
    expect(data.error).toBeDefined();
  });

  it("should not leak approval token or action links in POST /api/bookings", async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_name: "Security Auditor",
        visitor_email: "auditor@example.com",
        note: "Checking for leakage",
        mode: "meet",
        start_ts: "2026-11-01T10:00:00.000Z",
        end_ts: "2026-11-01T10:30:00.000Z",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.approval_token).toBeUndefined();
    expect(data.approveLink).toBeUndefined();
    expect(data.declineLink).toBeUndefined();
    expect(data.booking).toBeDefined();
    expect(data.booking.approval_token).toBeUndefined();
  });

  it("should return 503 when admin auth is unconfigured or password is under 8 characters", async () => {
    const origPass = process.env.ADMIN_PASSWORD;
    const origHash = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD_HASH = "short"; // < 8 characters

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "some-password" }),
    });
    expect(res.status).toBe(503);
    const data = await res.json() as any;
    expect(data.error).toBe("Admin login is not configured.");

    // Restore original env vars
    if (origPass) process.env.ADMIN_PASSWORD = origPass;
    else delete process.env.ADMIN_PASSWORD;
    if (origHash) process.env.ADMIN_PASSWORD_HASH = origHash;
    else delete process.env.ADMIN_PASSWORD_HASH;
  });
});
