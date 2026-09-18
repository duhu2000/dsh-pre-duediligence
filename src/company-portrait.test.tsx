import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { summarizeResult } from "./result-summary.js"
import { CollectionCards } from "./analysis-panels.js"
import type { HostedTask } from "./hosted-task-sync.js"

describe("company source portrait", () => {
  const profile = { 简介: "合成简介", 企查查行业: { 一级: "信息技术", 二级: "", 三级: "数据服务", 四级: "商业数据" }, 主营产品: ["合成产品", "<script>x</script>"], 企业规模: "大型", 产业链概览: "合成加工摘要" }
  it("preserves typed fields beyond generic fact limit and round trips JSON", () => {
    const row = { ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`字段${i}`, `${i}`])), ...profile }
    const result = summarizeResult({ data: row }, "profile")
    expect(result.facts).toHaveLength(18)
    expect(result.portrait?.products).toEqual(profile.主营产品)
    expect(result.portrait?.qccIndustry).toBe("一级：信息技术 / 三级：数据服务 / 四级：商业数据")
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })
  it("supports text transport, nested area, both industry formats and empty products", () => {
    const data = { 地区信息: {省份:"江苏",城市:"苏州",区域:"园区",地区代码:"001234"}, 国标行业: {门类:"信息业",大类:"服务业",中类:"",小类:""} }
    const result = summarizeResult({content:[{type:"text",text:JSON.stringify({data})}]}, "registration")
    expect(result.portrait?.region).toBe("江苏 / 苏州 / 园区")
    expect(result.portrait?.areaCode).toBe("001234")
    expect(result.portrait?.nationalIndustry).toBe("门类：信息业 / 大类：服务业")
    expect(summarizeResult({国标行业:"旧行业",企查查行业:"旧分类",主营产品:"旧产品"},"profile").portrait).toMatchObject({nationalIndustry:"旧行业",qccIndustry:"旧分类",products:["旧产品"]})
    expect(summarizeResult({主营产品:[]},"profile").portrait?.products).toEqual([])
    expect(summarizeResult({主营产品:null},"profile").portrait).toBeUndefined()
  })
  it("does not harvest secrets, unrelated list subjects or other dimensions", () => {
    expect(summarizeResult({token:profile,records:[profile]},"profile").portrait).toBeUndefined()
    expect(summarizeResult(profile,"bidding").portrait).toBeUndefined()
    const result = summarizeResult({主营产品:Array.from({length:30},(_,i)=>"产品"+i),简介:"a".repeat(5000)},"profile")
    expect(result.portrait?.products).toHaveLength(10)
    expect(result.portrait?.introduction).toHaveLength(1200)
  })
  it("renders core fields with escaped content and preserves legacy cards without mutation", () => {
    const task = {runs:[{id:"p",dimension:"profile",status:"done",startedAt:"2026-09-18",result:summarizeResult(profile,"profile")},{id:"r",dimension:"registration",status:"done",startedAt:"2026-09-18",result:{summary:"旧记录摘要",facts:[],factors:[]}}]} as unknown as HostedTask
    const before = JSON.stringify(task)
    const html = renderToStaticMarkup(<CollectionCards task={task}/>)
    for (const text of ["合成产品","大型","一级：信息技术","数据加工摘要","旧记录摘要"]) expect(html).toContain(text)
    expect(html).not.toContain("<script>")
    expect(JSON.stringify(task)).toBe(before)
  })
  it("does not equate empty products with absence of business", () => {
    const task = {runs:[{id:"p",dimension:"profile",status:"done",result:summarizeResult({主营产品:[]},"profile")}]} as unknown as HostedTask
    const html = renderToStaticMarkup(<CollectionCards task={task}/>)
    expect(html).toContain("本次未返回")
    expect(html).not.toContain("无主营产品")
  })
})
