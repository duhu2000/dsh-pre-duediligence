import type { CompanyPortrait } from "./company-portrait.js"
export function CompanyPortraitView({ portrait, dimension }: { portrait: CompanyPortrait; dimension: string }): JSX.Element {
  const rows = dimension === "registration"
    ? [["登记状态", portrait.status], ["注册地区", portrait.region], ["国标行业", portrait.nationalIndustry], ["注册资本", portrait.capital]]
    : [["企业简介", portrait.introduction], ["企查查行业", portrait.qccIndustry], ["主营产品", portrait.products?.length ? portrait.products.join("、") : undefined], ["企业规模", portrait.scale], ["企查查产业链概览（数据加工摘要）", portrait.overview]]
  return <div className="qccPwPortrait">
    {rows.map(([label, value]) => <p key={label}><strong>{label}：</strong>{value || "本次未返回"}</p>)}
    {dimension === "registration" && portrait.areaCode ? <details><summary>地区代码</summary><p>{portrait.areaCode}</p></details> : null}
    <p className="qccPwNote">{dimension === "registration" ? "注册地区不等于实际经营地点；国标行业与企查查行业属于不同分类体系。" : "产品与规模为来源画像，不代表订单、营收或信用结论；未返回不等于不存在。"}</p>
  </div>
}
