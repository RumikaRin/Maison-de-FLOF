import assert from "node:assert/strict";
import test from "node:test";
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hslToHex,
  isLightColor,
  shiftHue,
  getComplementaryColors,
  getAnalogousColors,
  getTriadicColors,
  colorDistance,
  findClosestColor,
} from "../src/lib/color-utils.ts";

test("hexToRgb converts 6-digit hex to RGB correctly", () => {
  assert.deepEqual(hexToRgb("#ffffff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hexToRgb("#ff0000"), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hexToRgb("00ff00"), { r: 0, g: 255, b: 0 });
});

test("rgbToHex converts RGB values to formatted hex", () => {
  assert.equal(rgbToHex(255, 255, 255).toLowerCase(), "#ffffff");
  assert.equal(rgbToHex(0, 0, 0).toLowerCase(), "#000000");
  assert.equal(rgbToHex(255, 0, 128).toLowerCase(), "#ff0080");
});

test("isLightColor identifies perceived brightness according to WCAG luminance", () => {
  assert.equal(isLightColor("#ffffff"), true);
  assert.equal(isLightColor("#f5f0e8"), true); // Ivory white
  assert.equal(isLightColor("#000000"), false);
  assert.equal(isLightColor("#1a1a1a"), false);
});

test("hexToHsl and hslToHex round trip accurately", () => {
  const pureRedHsl = hexToHsl("#ff0000");
  assert.equal(pureRedHsl.h, 0);
  assert.equal(pureRedHsl.s, 100);
  assert.equal(pureRedHsl.l, 50);

  const backToHex = hslToHex(pureRedHsl.h, pureRedHsl.s, pureRedHsl.l);
  assert.equal(backToHex.toLowerCase(), "#ff0000");
});

test("shiftHue rotates color degrees on HSL cylinder", () => {
  const redHex = "#ff0000";
  const complementary = getComplementaryColors(redHex);
  assert.equal(complementary.length, 1);
  // Complementary of red (0 deg) is cyan (~180 deg)
  const compHsl = hexToHsl(complementary[0]);
  assert.equal(compHsl.h, 180);

  const analogous = getAnalogousColors(redHex);
  assert.equal(analogous.length, 2);

  const triadic = getTriadicColors(redHex);
  assert.equal(triadic.length, 2);
});

test("harmony pairs on grey stay two distinct hexes", () => {
  const grey = "#bfbfbf";
  const analogous = getAnalogousColors(grey);
  assert.equal(analogous.length, 2);
  assert.notEqual(analogous[0].toLowerCase(), analogous[1].toLowerCase());

  const triadic = getTriadicColors(grey);
  assert.equal(triadic.length, 2);
  assert.notEqual(triadic[0].toLowerCase(), triadic[1].toLowerCase());
});

test("colorDistance computes Euclidean RGB delta", () => {
  assert.equal(colorDistance("#ffffff", "#ffffff"), 0);
  const distance = colorDistance("#000000", "#ffffff");
  assert.equal(Math.round(distance), 442);
});

test("findClosestColor selects nearest match in palette", () => {
  const palette = [
    { id: "1", code: "0001", name: "Trắng", hex: "#ffffff" },
    { id: "2", code: "3003", name: "Xám Than", hex: "#4a4a4a" },
    { id: "3", code: "7001", name: "Xanh Biển", hex: "#0077b6" },
  ];

  const closestToOffWhite = findClosestColor("#fafafa", palette);
  assert.equal(closestToOffWhite?.code, "0001");

  const closestToDark = findClosestColor("#333333", palette);
  assert.equal(closestToDark?.code, "3003");

  assert.equal(findClosestColor("#ffffff", []), null);
});
