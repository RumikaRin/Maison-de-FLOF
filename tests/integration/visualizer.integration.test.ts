import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  createVisualizerDesign,
  deleteVisualizerDesign,
  getVisualizerDesign,
  listVisualizerDesigns,
  listVisualizerRooms,
  updateVisualizerDesign,
} from "../../src/services/visualizer.service.ts";
import { ApiError } from "../../src/lib/api-auth.ts";
import {
  loadTestFixtures,
  P1_FIXTURES,
  TEST_FIXTURES,
} from "../../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "./helpers/test-database.ts";

const database = createTestDatabase();

async function cleanup() {
  await database.visualizerDesign.deleteMany({
    where: { name: { startsWith: "Integration design" } },
  });
}

before(async () => {
  await loadTestFixtures();
});
beforeEach(cleanup);
after(async () => {
  await cleanup();
  await database.$disconnect();
});

test("rooms expose only active templates in sort order", async () => {
  const rooms = await listVisualizerRooms(database);
  assert.ok(rooms.length >= 4);
  assert.ok(rooms.every((room) => room.isActive));
  assert.deepEqual(
    rooms.map(({ sortOrder }) => sortOrder),
    rooms.map(({ sortOrder }) => sortOrder).sort((a, b) => a - b),
  );
});

test("visualizer designs are owner-scoped across read, update and delete", async () => {
  const [owner, other, room] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: P1_FIXTURES.customerTwoEmail },
    }),
    database.visualizerRoom.findFirstOrThrow({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const created = await createVisualizerDesign(database, owner.id, {
    roomId: room.id,
    name: "Integration design initial",
    palette: [
      { zone: "wallMain", colorCode: "FLOF-001", hex: "#4A6741" },
      { zone: "wallAccent", colorCode: "FLOF-002", hex: "#F5F0E8" },
    ],
  });

  assert.equal((await listVisualizerDesigns(database, owner.id)).length, 1);
  assert.equal((await listVisualizerDesigns(database, other.id)).length, 0);
  assert.equal(
    (await getVisualizerDesign(database, owner.id, created.id)).id,
    created.id,
  );
  await assert.rejects(
    () => getVisualizerDesign(database, other.id, created.id),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  );
  await assert.rejects(
    () =>
      updateVisualizerDesign(database, other.id, created.id, {
        name: "Integration design stolen",
      }),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  );
  await assert.rejects(
    () => deleteVisualizerDesign(database, other.id, created.id),
    (error: unknown) => error instanceof ApiError && error.status === 404,
  );

  const updated = await updateVisualizerDesign(
    database,
    owner.id,
    created.id,
    { name: "Integration design renamed" },
  );
  assert.equal(updated.name, "Integration design renamed");
  await deleteVisualizerDesign(database, owner.id, created.id);
  assert.equal(
    await database.visualizerDesign.count({ where: { id: created.id } }),
    0,
  );
});

test("palette validation rejects invalid colors and oversized payloads", async () => {
  const owner = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.customerEmail },
  });
  const room = await database.visualizerRoom.findFirstOrThrow();

  await assert.rejects(
    () =>
      createVisualizerDesign(database, owner.id, {
        roomId: room.id,
        name: "Integration design invalid",
        palette: [{ zone: "wall", colorCode: "BAD", hex: "red" }],
      }),
    (error: unknown) => error instanceof ApiError && error.status === 400,
  );
});
