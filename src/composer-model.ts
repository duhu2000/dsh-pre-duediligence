export const COMPANY_PLACEHOLDER = "（这里输入企业名）"

export type ComposerOption = {
  id: string
  label: string
  phrase: string
  extraClause?: string
}

export const ROLE_OPTIONS = [
  { id: "bank_rm", label: "银行/信贷客户经理", phrase: "银行对公客户经理" },
  { id: "sales", label: "销售/BD", phrase: "销售" },
  { id: "procure", label: "采购/供应链", phrase: "采购负责人" },
  { id: "invest", label: "投资机构", phrase: "投资机构人员" },
  { id: "gov", label: "政府/园区招商", phrase: "园区招商人员" },
  { id: "other", label: "其他", phrase: "准备拜访企业的商务人员" },
] as const satisfies readonly ComposerOption[]

export const PURPOSE_OPTIONS = [
  { id: "first", label: "首次拜访", phrase: "首次" },
  { id: "nego", label: "谈判前拜访", phrase: "在商务谈判前" },
  {
    id: "revisit",
    label: "复访",
    phrase: "复访前更新式地",
    extraClause: "如有此前对该企业的尽调记录，请对比说明变化；若无记录，请照常全量尽调并注明是首次。",
  },
] as const satisfies readonly ComposerOption[]

export const FOCUS_OPTIONS = [
  { id: "risk", label: "风险与涉诉", phrase: "风险与涉诉" },
  { id: "equity", label: "股权与实控人", phrase: "股权与实控人" },
  { id: "finance", label: "经营与财务", phrase: "经营与财务" },
  { id: "contact", label: "联系人与触达", phrase: "联系人与触达路径" },
  { id: "ipr", label: "知识产权", phrase: "知识产权" },
  { id: "bidding", label: "招投标业绩", phrase: "招投标业绩" },
] as const satisfies readonly ComposerOption[]

export const BUDGET_OPTIONS = [
  { id: "fast", label: "3分钟速览", phrase: "速览" },
  { id: "standard", label: "15分钟标准", phrase: "标准" },
  { id: "deep", label: "深度尽调", phrase: "深度" },
] as const satisfies readonly ComposerOption[]

export const OUTPUT_OPTIONS = [
  { id: "onepager", label: "一页纸简报", phrase: "一页纸简报" },
  { id: "questions", label: "提问清单为主", phrase: "以当面提问清单为主的简报" },
  { id: "full", label: "完整报告", phrase: "完整尽调报告" },
  { id: "share", label: "可转发摘要", phrase: "适合转发给同事的简短摘要" },
] as const satisfies readonly ComposerOption[]

export type ComposerSelection = {
  role?: string
  purpose?: string
  focus: string[]
  budget?: string
  output?: string
}

export type ComposerMode = "generated" | "manual"

export type ComposerState = {
  text: string
  lastGenerated: string
  lastCompany: string
  mode: ComposerMode
}

/**
 * 新任务的显式产品默认值。默认值只负责减少重复点选，用户仍可逐项取消或改选；
 * 场合不预设，避免把首次拜访等业务事实强加给用户。
 */
export const EMPTY_SELECTION: ComposerSelection = {
  role: "bank_rm",
  focus: FOCUS_OPTIONS.map(option => option.id),
  budget: "fast",
  output: "onepager",
}
export const EMPTY_COMPOSER_STATE: ComposerState = {
  text: "",
  lastGenerated: "",
  lastCompany: "",
  mode: "generated",
}

function optionById(options: readonly ComposerOption[], id: string | undefined): ComposerOption | undefined {
  return id === undefined ? undefined : options.find(option => option.id === id)
}

function hasSelection(selection: ComposerSelection): boolean {
  return selection.role !== undefined
    || selection.purpose !== undefined
    || selection.focus.length > 0
    || selection.budget !== undefined
    || selection.output !== undefined
}

export function composeFullSentence(selection: ComposerSelection, company = ""): string {
  if (!hasSelection(selection) && company.trim() === "") {
    return ""
  }

  const role = optionById(ROLE_OPTIONS, selection.role)
  const purpose = optionById(PURPOSE_OPTIONS, selection.purpose)
  const budget = optionById(BUDGET_OPTIONS, selection.budget)
  const output = optionById(OUTPUT_OPTIONS, selection.output)
  const focus = selection.focus
    .map(id => optionById(FOCUS_OPTIONS, id)?.phrase)
    .filter((phrase): phrase is string => phrase !== undefined)
  const target = company.trim() || COMPANY_PLACEHOLDER
  const firstClause = (role === undefined ? "" : "我是" + role.phrase + "，")
    + "准备"
    + (purpose?.phrase ?? "")
    + "拜访"
    + target
  const clauses = [
    firstClause,
    focus.length === 0 ? undefined : "请重点看" + focus.join("、"),
    budget === undefined ? undefined : "做一次" + budget.phrase + "尽调",
    output === undefined ? undefined : "输出" + output.phrase,
  ].filter((clause): clause is string => clause !== undefined)
  const extraClause = purpose?.extraClause
  return clauses.join("，") + "。" + (extraClause ?? "")
}

export function composeImperative(selection: ComposerSelection): string {
  if (!hasSelection(selection)) {
    return ""
  }

  const role = optionById(ROLE_OPTIONS, selection.role)
  const purpose = optionById(PURPOSE_OPTIONS, selection.purpose)
  const budget = optionById(BUDGET_OPTIONS, selection.budget)
  const output = optionById(OUTPUT_OPTIONS, selection.output)
  const focus = selection.focus
    .map(id => optionById(FOCUS_OPTIONS, id)?.phrase)
    .filter((phrase): phrase is string => phrase !== undefined)
  const clauses = [
    role === undefined ? undefined : "按" + role.phrase + "视角",
    purpose === undefined ? undefined : purpose.phrase + "开展本次拜访准备",
    focus.length === 0 ? undefined : "重点看" + focus.join("、"),
    budget === undefined ? undefined : "做一次" + budget.phrase + "尽调",
    output === undefined ? undefined : "输出" + output.phrase,
  ].filter((clause): clause is string => clause !== undefined)
  return "请" + clauses.join("，") + "。" + (purpose?.extraClause ?? "")
}

function capturePlaceholderCompany(lastGenerated: string, currentText: string): string | undefined {
  const placeholderAt = lastGenerated.indexOf(COMPANY_PLACEHOLDER)
  if (placeholderAt < 0) {
    return undefined
  }
  const prefix = lastGenerated.slice(0, placeholderAt)
  const suffix = lastGenerated.slice(placeholderAt + COMPANY_PLACEHOLDER.length)
  if (!currentText.startsWith(prefix) || !currentText.endsWith(suffix)) {
    return undefined
  }
  const captured = currentText.slice(prefix.length, currentText.length - suffix.length).trim()
  return captured === "" || captured === COMPANY_PLACEHOLDER ? undefined : captured
}

export function updateManualText(state: ComposerState, text: string): ComposerState {
  if (text === state.lastGenerated || text === "") {
    return { ...state, text, mode: "generated" }
  }
  const captured = capturePlaceholderCompany(state.lastGenerated, text)
  if (captured !== undefined) {
    return { ...state, text, lastCompany: captured, mode: "generated" }
  }
  if (state.lastGenerated !== "" && text.startsWith(state.lastGenerated)) {
    return { ...state, text, mode: "generated" }
  }
  return { ...state, text, mode: "manual" }
}

export function applySelection(state: ComposerState, selection: ComposerSelection, companyOverride?: string): ComposerState {
  if (state.mode === "manual") {
    return state
  }

  const captured = capturePlaceholderCompany(state.lastGenerated, state.text)
  // 表单里填的企业名优先；其次是用户直接替换占位符写进输入框的；最后沿用上次
  const company = (companyOverride !== undefined && companyOverride.trim() !== "") ? companyOverride.trim() : (captured ?? state.lastCompany)
  const tail = state.lastGenerated !== "" && state.text.startsWith(state.lastGenerated)
    ? state.text.slice(state.lastGenerated.length)
    : ""
  const generated = composeFullSentence(selection, company)
  return {
    text: generated + tail,
    lastGenerated: generated,
    lastCompany: company,
    mode: "generated",
  }
}

export function generateFromSelection(state: ComposerState, selection: ComposerSelection): ComposerState {
  if (state.mode !== "manual") {
    return applySelection(state, selection)
  }
  const imperative = composeImperative(selection)
  if (imperative === "") {
    return state
  }
  const separator = state.text.trim() === "" || state.text.endsWith("\n") ? "" : "\n"
  return {
    ...state,
    text: state.text + separator + imperative,
    mode: "manual",
  }
}

export function validateComposerText(text: string): string | undefined {
  const normalized = text.trim()
  if (normalized === "") {
    return "请说明要拜访的企业"
  }
  if (normalized.includes(COMPANY_PLACEHOLDER)) {
    return "请将占位符替换为企业完整注册名称、简称或统一社会信用代码"
  }
  return undefined
}

export function createTaskId(now = new Date(), randomValue = Math.random()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "")
  const suffix = Math.floor(randomValue * 0x100000).toString(36).padStart(4, "0").slice(0, 4).toUpperCase()
  return "PV-" + date + "-" + suffix
}

export function serializePrevisitRequest(text: string, taskId: string): string {
  return [
    text.trim(),
    "",
    "访前任务 ID：" + taskId,
    "请使用 qcc-previsit-onepager Skill 执行；调用 previsit_begin 时将上述 ID 原样作为 requestId，完成后通过 previsit_finalize 保存报告并回写完成标记。",
  ].join("\n")
}
