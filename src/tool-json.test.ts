import { expect, it } from "vitest"
import { toolJson } from "./tool-json.js"
it("omits optional fields deeply and roundtrips without losing information", () => {
  const value = toolJson({ parentTaskId: undefined, tasks: [{ entity: undefined, id: "V1" }], empty: null })
  expect(value).toEqual({ tasks: [{ id: "V1" }], empty: null })
  expect(JSON.parse(JSON.stringify(value))).toStrictEqual(value)
})
it("rejects values JSON would silently corrupt", () => {
  for (const value of [NaN, Infinity, -0, 1n, new Date(), [undefined], Array(1), () => {}, Symbol()]) expect(() => toolJson(value)).toThrow()
  const cycle: Record<string, unknown> = {}; cycle.self = cycle
  expect(() => toolJson(cycle)).toThrow()
})
