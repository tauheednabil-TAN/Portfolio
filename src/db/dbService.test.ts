import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import {
  getDB,
  saveDB,
  listChunks,
  saveChunk,
  deleteChunk,
  listPosts,
  savePost,
  deletePost,
  listRoadmapNodes,
  saveRoadmapNode,
  deleteRoadmapNode,
  listBookings,
  addBooking,
  updateBookingStatus,
  getBookingByToken,
  getSettings,
  updateSettings,
  searchKnowledge
} from "./dbService.js";

const DB_PATH = path.join(process.cwd(), "src", "db", "db.json");
const BACKUP_PATH = path.join(process.cwd(), "src", "db", "db.json.bak");

describe("Database Service (dbService) Unit Tests", () => {
  // Backup existing database if it exists
  beforeAll(async () => {
    if (fs.existsSync(DB_PATH)) {
      await fs.promises.copyFile(DB_PATH, BACKUP_PATH);
    }
  });

  // Restore database backup after all tests complete
  afterAll(async () => {
    if (fs.existsSync(BACKUP_PATH)) {
      await fs.promises.copyFile(BACKUP_PATH, DB_PATH);
      await fs.promises.unlink(BACKUP_PATH);
    } else if (fs.existsSync(DB_PATH)) {
      await fs.promises.unlink(DB_PATH);
    }
  });

  describe("Core DB Store operations", () => {
    it("should fetch/initialize the database with default seed data", async () => {
      // Remove db file to force clean initialization
      if (fs.existsSync(DB_PATH)) {
        await fs.promises.unlink(DB_PATH);
      }
      
      const db = await getDB();
      expect(db).toBeDefined();
      expect(db.knowledge_chunks).toBeInstanceOf(Array);
      expect(db.knowledge_chunks.length).toBeGreaterThan(0);
      expect(db.posts).toBeInstanceOf(Array);
      expect(db.posts.length).toBeGreaterThan(0);
      expect(db.roadmap_nodes).toBeInstanceOf(Array);
      expect(db.roadmap_nodes.length).toBeGreaterThan(0);
      expect(db.settings).toBeDefined();
      expect(db.settings.myEmail).toBe("tauheednabil@gmail.com");
    });

    it("should persist custom modifications to the database", async () => {
      const db = await getDB();
      const originalEmail = db.settings.myEmail;
      
      db.settings.myEmail = "test-email@example.com";
      await saveDB(db);

      // Force cache reload / read from file again
      const fileContent = JSON.parse(await fs.promises.readFile(DB_PATH, "utf-8"));
      expect(fileContent.settings.myEmail).toBe("test-email@example.com");

      // Reset back for subsequent tests
      db.settings.myEmail = originalEmail;
      await saveDB(db);
    });
  });

  describe("Knowledge Chunk operations", () => {
    it("should list all knowledge chunks", async () => {
      const chunks = await listChunks();
      expect(chunks).toBeInstanceOf(Array);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should successfully save/add a new knowledge chunk", async () => {
      const newChunk = await saveChunk({
        category: "other",
        source: "Test Source",
        content: "This is a custom test content for checking saving operations.",
      });

      expect(newChunk.id).toBeDefined();
      expect(newChunk.category).toBe("other");
      expect(newChunk.source).toBe("Test Source");
      expect(newChunk.content).toBe("This is a custom test content for checking saving operations.");
      expect(newChunk.created_at).toBeDefined();

      const chunks = await listChunks();
      expect(chunks.some((c) => c.id === newChunk.id)).toBe(true);
    });

    it("should update an existing knowledge chunk by ID", async () => {
      const chunks = await listChunks();
      const target = chunks[0];
      const originalContent = target.content;

      const updated = await saveChunk({
        id: target.id,
        category: target.category,
        source: target.source,
        content: "Updated Content!",
      });

      expect(updated.id).toBe(target.id);
      expect(updated.content).toBe("Updated Content!");

      // Restore original state
      await saveChunk({
        id: target.id,
        category: target.category,
        source: target.source,
        content: originalContent,
      });
    });

    it("should delete a knowledge chunk", async () => {
      const tempChunk = await saveChunk({
        category: "other",
        source: "Temp Source",
        content: "Temp content to delete",
      });

      const beforeCount = (await listChunks()).length;
      const deleteResult = await deleteChunk(tempChunk.id);
      const afterCount = (await listChunks()).length;

      expect(deleteResult).toBe(true);
      expect(afterCount).toBe(beforeCount - 1);

      // Deleting a non-existent chunk should return false
      const nonExistentResult = await deleteChunk("non-existent-id");
      expect(nonExistentResult).toBe(false);
    });
  });

  describe("Blog Post operations", () => {
    it("should list published blog posts by default", async () => {
      const posts = await listPosts(false);
      expect(posts.every((p) => p.published)).toBe(true);
    });

    it("should list all blog posts including drafts when requested", async () => {
      const draftPost = await savePost({
        title: "Draft Test Post",
        body_md: "Draft body content",
        image_url: "",
        tags: ["draft"],
        published: false,
      });

      const allPosts = await listPosts(true);
      expect(allPosts.some((p) => p.id === draftPost.id)).toBe(true);

      const publishedOnly = await listPosts(false);
      expect(publishedOnly.some((p) => p.id === draftPost.id)).toBe(false);

      // Clean up
      await deletePost(draftPost.id);
    });

    it("should save and update blog posts", async () => {
      const post = await savePost({
        title: "New Blog Post",
        body_md: "New blog post content",
        image_url: "",
        tags: ["new"],
        published: true,
      });

      expect(post.id).toBeDefined();
      expect(post.title).toBe("New Blog Post");

      const updated = await savePost({
        id: post.id,
        title: "Updated Blog Post Title",
        body_md: post.body_md,
        image_url: post.image_url,
        tags: post.tags,
        published: post.published,
      });

      expect(updated.id).toBe(post.id);
      expect(updated.title).toBe("Updated Blog Post Title");

      await deletePost(post.id);
    });
  });

  describe("Roadmap operations", () => {
    it("should list roadmap nodes", async () => {
      const nodes = await listRoadmapNodes();
      expect(nodes).toBeInstanceOf(Array);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it("should save and update a roadmap node", async () => {
      const node = await saveRoadmapNode({
        parent_id: null,
        title: "Test Roadmap Node",
        description: "Test Description",
        status: "planned",
        sort_order: 10,
        icon: "Cpu",
        date_label: "2026",
      });

      expect(node.id).toBeDefined();
      expect(node.title).toBe("Test Roadmap Node");

      const updated = await saveRoadmapNode({
        id: node.id,
        parent_id: null,
        title: "Updated Test Node",
        description: "Test Description",
        status: "in_progress",
        sort_order: 10,
        icon: "Cpu",
        date_label: "2026",
      });

      expect(updated.title).toBe("Updated Test Node");
      expect(updated.status).toBe("in_progress");

      await deleteRoadmapNode(node.id);
    });

    it("should recursively delete subnodes when deleting a parent node", async () => {
      const parent = await saveRoadmapNode({
        parent_id: null,
        title: "Parent Node",
        description: "Parent",
        status: "planned",
        sort_order: 1,
        icon: "Cpu",
        date_label: "2026",
      });

      const child = await saveRoadmapNode({
        parent_id: parent.id,
        title: "Child Node",
        description: "Child",
        status: "planned",
        sort_order: 1,
        icon: "Cpu",
        date_label: "2026",
      });

      const grandchild = await saveRoadmapNode({
        parent_id: child.id,
        title: "Grandchild Node",
        description: "Grandchild",
        status: "planned",
        sort_order: 1,
        icon: "Cpu",
        date_label: "2026",
      });

      const nodesBefore = await listRoadmapNodes();
      expect(nodesBefore.some((n) => n.id === child.id)).toBe(true);
      expect(nodesBefore.some((n) => n.id === grandchild.id)).toBe(true);

      await deleteRoadmapNode(parent.id);

      const nodesAfter = await listRoadmapNodes();
      expect(nodesAfter.some((n) => n.id === parent.id)).toBe(false);
      expect(nodesAfter.some((n) => n.id === child.id)).toBe(false);
      expect(nodesAfter.some((n) => n.id === grandchild.id)).toBe(false);
    });
  });

  describe("Booking operations", () => {
    it("should list and add bookings with a pending status and an approval token", async () => {
      const b = await addBooking({
        visitor_name: "John Doe",
        visitor_email: "john@example.com",
        note: "Keen to discuss AI agents.",
        mode: "meet",
        start_ts: "2026-08-10T14:00:00Z",
        end_ts: "2026-08-10T14:30:00Z",
      });

      expect(b.id).toBeDefined();
      expect(b.status).toBe("pending");
      expect(b.approval_token).toBeDefined();
      expect(b.created_at).toBeDefined();

      const list = await listBookings();
      expect(list.some((booking) => booking.id === b.id)).toBe(true);

      const fetchedByToken = await getBookingByToken(b.approval_token);
      expect(fetchedByToken).not.toBeNull();
      expect(fetchedByToken?.id).toBe(b.id);
    });

    it("should update a booking's status", async () => {
      const b = await addBooking({
        visitor_name: "Alice Smith",
        visitor_email: "alice@example.com",
        note: "Discuss bug reports.",
        mode: "meet",
        start_ts: "2026-08-11T10:00:00Z",
        end_ts: "2026-08-11T10:30:00Z",
      });

      const updated = await updateBookingStatus(b.id, "confirmed", "gcal_event_123");
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe("confirmed");
      expect(updated?.gcal_event_id).toBe("gcal_event_123");
    });
  });

  describe("Settings operations", () => {
    it("should retrieve system settings", async () => {
      const s = await getSettings();
      expect(s).toBeDefined();
      expect(s.availabilityHoursStart).toBeDefined();
      expect(s.availabilityHoursEnd).toBeDefined();
    });

    it("should update settings values", async () => {
      const s = await getSettings();
      const originalTimezone = s.timezone;

      const updated = await updateSettings({
        ...s,
        timezone: "Asia/Dhaka",
      });

      expect(updated.timezone).toBe("Asia/Dhaka");

      // Restore original setting
      await updateSettings({
        ...s,
        timezone: originalTimezone,
      });
    });
  });

  describe("Semantic Search operations", () => {
    it("should search knowledge chunks using keywords and return ordered results", async () => {
      const query = "Sentinel cybersecurity 12 agents";
      const results = await searchKnowledge(query);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      // Sentinel project chunk should be top result or highly ranked
      expect(results[0].content).toContain("Sentinel");
    });

    it("should fallback to default biographical categories if nothing matches the query", async () => {
      const query = "nonexistentgibberishxyz";
      const results = await searchKnowledge(query);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      // Fallback categories include about, skills, faq
      expect(["about", "skills", "faq"]).toContain(results[0].category);
    });
  });
});
