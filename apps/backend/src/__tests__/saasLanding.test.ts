import request from "supertest";
import { createApp } from "../app";
import { controlClient } from "../db/controlClient";
import {
  loginAsSaasAdmin,
  setupTestSaasAdmin,
  teardownTestSaasAdmin,
  TestSaasAdmin,
} from "./testUtils";

const app = createApp();
let admin: TestSaasAdmin;
let token: string;

const createdBlockIds: number[] = [];
const createdBlogIds: number[] = [];
const createdContactIds: number[] = [];
const createdPackageIds: number[] = [];
let originalSiteName: string | undefined;
let originalStatOrder: { id: number; sortOrder: number }[] = [];

beforeAll(async () => {
  admin = await setupTestSaasAdmin("saas-landing");
  token = await loginAsSaasAdmin(app, admin);
  const settings = await controlClient.saasSiteSettings.findFirst();
  originalSiteName = settings?.siteName;
  originalStatOrder = (
    await controlClient.saasLandingBlock.findMany({ where: { blockType: "STAT" } })
  ).map((b) => ({ id: b.id, sortOrder: b.sortOrder }));
}, 30000);

afterAll(async () => {
  await controlClient.saasLandingBlock.deleteMany({ where: { id: { in: createdBlockIds } } });
  await controlClient.saasBlogPost.deleteMany({ where: { id: { in: createdBlogIds } } });
  await controlClient.saasContactSubmission.deleteMany({ where: { id: { in: createdContactIds } } });
  await controlClient.package.deleteMany({ where: { id: { in: createdPackageIds } } });
  // Restore state the tests mutated so a shared dev DB stays sensible.
  if (originalSiteName !== undefined && originalStatOrder.length > 0) {
    const settings = await controlClient.saasSiteSettings.findFirst();
    if (settings) {
      await controlClient.saasSiteSettings.update({
        where: { id: settings.id },
        data: { siteName: originalSiteName },
      });
    }
    for (const stat of originalStatOrder) {
      await controlClient.saasLandingBlock
        .update({ where: { id: stat.id }, data: { sortOrder: stat.sortOrder } })
        .catch(() => undefined);
    }
  }
  await teardownTestSaasAdmin(admin);
  await controlClient.$disconnect();
});

function authed(req: request.Test) {
  return req.set("Authorization", `Bearer ${token}`);
}

describe("SaaS landing content", () => {
  it("serves the public aggregation endpoint without auth", async () => {
    const res = await request(app).get("/saas/public/landing-content");
    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(Array.isArray(res.body.featureHighlights)).toBe(true);
    expect(Array.isArray(res.body.packages)).toBe(true);
  });

  it("requires auth for admin settings", async () => {
    const res = await request(app).patch("/saas/admin/landing/settings").send({ siteName: "x" });
    expect(res.status).toBe(401);
  });

  it("updates settings and reflects the change after cache invalidation", async () => {
    const unique = `Test Co ${Date.now()}`;
    const patchRes = await authed(request(app).patch("/saas/admin/landing/settings")).send({
      siteName: unique,
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.siteName).toBe(unique);

    const publicRes = await request(app).get("/saas/public/landing-content");
    expect(publicRes.body.settings.siteName).toBe(unique);
  });

  it("creates, reorders and deletes landing blocks", async () => {
    const a = await authed(request(app).post("/saas/admin/landing/blocks")).send({
      blockType: "STAT",
      title: "Stat A",
      value: "1",
    });
    const b = await authed(request(app).post("/saas/admin/landing/blocks")).send({
      blockType: "STAT",
      title: "Stat B",
      value: "2",
    });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    createdBlockIds.push(a.body.id, b.body.id);
    expect(a.body.sortOrder).toBeLessThan(b.body.sortOrder);

    // reorder takes the full ordered list for the type; reverse it and check the
    // two we just added swapped relative position.
    const list = await authed(request(app).get("/saas/admin/landing/blocks").query({ blockType: "STAT" }));
    const reversedIds = list.body.map((x: { id: number }) => x.id).reverse();
    const reorder = await authed(request(app).post("/saas/admin/landing/blocks/reorder")).send({
      blockType: "STAT",
      orderedIds: reversedIds,
    });
    expect(reorder.status).toBe(200);
    const posA = reorder.body.findIndex((x: { id: number }) => x.id === a.body.id);
    const posB = reorder.body.findIndex((x: { id: number }) => x.id === b.body.id);
    expect(posB).toBeLessThan(posA);
    expect(reorder.body[0].sortOrder).toBe(0);

    // rejects an incomplete ordered list
    const bad = await authed(request(app).post("/saas/admin/landing/blocks/reorder")).send({
      blockType: "STAT",
      orderedIds: [a.body.id],
    });
    expect(bad.status).toBe(400);

    const del = await authed(request(app).delete(`/saas/admin/landing/blocks/${a.body.id}`));
    expect(del.status).toBe(204);
  });

  it("stores flat testimonial fields into meta and maps them back", async () => {
    const res = await authed(request(app).post("/saas/admin/landing/blocks")).send({
      blockType: "TESTIMONIAL",
      title: "Quote block",
      subtitle: "Great product",
      authorName: "Jamie",
      rating: 5,
    });
    expect(res.status).toBe(201);
    createdBlockIds.push(res.body.id);
    expect(res.body.authorName).toBe("Jamie");
    expect(res.body.rating).toBe(5);
  });
});

describe("SaaS blog", () => {
  it("slugifies the title and keeps drafts off the public list", async () => {
    const res = await authed(request(app).post("/saas/admin/blog"))
      .field("title", "Hello World Post")
      .field("contentMarkdown", "# Hi\n\nBody.");
    expect(res.status).toBe(201);
    createdBlogIds.push(res.body.id);
    expect(res.body.slug).toBe("hello-world-post");
    expect(res.body.status).toBe("DRAFT");

    const list = await request(app).get("/saas/public/blog");
    expect(list.body.some((p: { id: number }) => p.id === res.body.id)).toBe(false);
  });

  it("publishes a post, sets publishedAt and exposes it publicly by slug", async () => {
    const created = await authed(request(app).post("/saas/admin/blog"))
      .field("title", "Publish Me")
      .field("contentMarkdown", "Content here.");
    createdBlogIds.push(created.body.id);

    const pub = await authed(request(app).post(`/saas/admin/blog/${created.body.id}/publish`));
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe("PUBLISHED");
    expect(pub.body.publishedAt).not.toBeNull();

    const detail = await request(app).get(`/saas/public/blog/${created.body.slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.contentMarkdown).toContain("Content here.");
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await request(app).get("/saas/public/blog/does-not-exist-xyz");
    expect(res.status).toBe(404);
  });
});

describe("SaaS contact form", () => {
  it("strips HTML from submissions and stores them as UNREAD", async () => {
    const res = await request(app)
      .post("/saas/public/contact")
      .send({ name: "<b>Bob</b>", email: "bob@example.com", message: "<script>x</script>Hello" });
    expect(res.status).toBe(201);
    createdContactIds.push(res.body.id);
    expect(res.body.name).toBe("Bob");
    expect(res.body.message).toBe("Hello");
    expect(res.body.status).toBe("UNREAD");
  });

  it("lets an admin filter and transition status", async () => {
    const id = createdContactIds[0];
    const patch = await authed(request(app).patch(`/saas/admin/contact/${id}/status`)).send({
      status: "READ",
    });
    expect(patch.status).toBe(200);
    expect(patch.body.status).toBe("READ");

    const list = await authed(request(app).get("/saas/admin/contact")).query({ status: "READ" });
    expect(list.body.some((r: { id: number }) => r.id === id)).toBe(true);
  });

  it("blocks the admin inbox without a token", async () => {
    const res = await request(app).get("/saas/admin/contact");
    expect(res.status).toBe(401);
  });
});

describe("Package landing fields", () => {
  it("round-trips the new marketing fields and orders by sortOrder", async () => {
    const first = await authed(request(app).post("/saas/admin/packages")).send({
      name: "Z Plan",
      price: 10,
      validityDays: null,
      sortOrder: 5,
      features: ["A", "B"],
      isPopular: true,
      billingPeriod: "per month",
      ctaLabel: "Choose Z",
    });
    const second = await authed(request(app).post("/saas/admin/packages")).send({
      name: "A Plan",
      price: 20,
      validityDays: null,
      sortOrder: 1,
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    createdPackageIds.push(first.body.id, second.body.id);
    expect(first.body.features).toEqual(["A", "B"]);
    expect(first.body.isPopular).toBe(true);

    const list = await authed(request(app).get("/saas/admin/packages"));
    const names = list.body
      .filter((p: { id: number }) => createdPackageIds.includes(p.id))
      .map((p: { name: string }) => p.name);
    expect(names.indexOf("A Plan")).toBeLessThan(names.indexOf("Z Plan"));
  });
});
