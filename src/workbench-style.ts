/** DSH-UX-001 v1.5.0：所有变量和组件选择器均限定在本插件拥有的节点内。 */
export const WORKBENCH_CSS = String.raw`
.qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent{
  --qcc-brand:#128BED;
  --qcc-action:#0875D1;
  --qcc-action-hover:#0666B7;
  --qcc-action-text:#fff;
  --qcc-selected:#E6F4FF;
  --qcc-table-head:#F2F9FC;
  --qcc-page:#F6F8FA;
  --qcc-surface:#FFFFFF;
  --qcc-text:#202C3B;
  --qcc-secondary:#626F80;
  --qcc-border:#DCE4EC;
  --qcc-success:#12805C;
  --qcc-success-bg:#EDF8F2;
  --qcc-review:#946000;
  --qcc-review-bg:#FFF7E5;
  --qcc-danger:#B42318;
  --qcc-danger-bg:#FFF1F0;
  color:var(--qcc-text);
}
:is(html[data-theme="dark"],html.dark) :is(.qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent){
  --qcc-brand:#55ADFF;
  --qcc-action:#82C3FF;
  --qcc-action-hover:#ACD7FF;
  --qcc-action-text:#101820;
  --qcc-selected:#173449;
  --qcc-table-head:#172C3B;
  --qcc-page:#101820;
  --qcc-surface:#18232E;
  --qcc-text:#E7EEF6;
  --qcc-secondary:#A2B1C2;
  --qcc-border:#344657;
  --qcc-success:#78D8B3;
  --qcc-success-bg:#193A30;
  --qcc-review:#F3C66C;
  --qcc-review-bg:#3D321D;
  --qcc-danger:#FF9B91;
  --qcc-danger-bg:#442826;
}
@media(prefers-color-scheme:dark){
  .qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent{
    --qcc-brand:#55ADFF;
    --qcc-action:#82C3FF;
    --qcc-action-hover:#ACD7FF;
    --qcc-action-text:#101820;
    --qcc-selected:#173449;
    --qcc-table-head:#172C3B;
    --qcc-page:#101820;
    --qcc-surface:#18232E;
    --qcc-text:#E7EEF6;
    --qcc-secondary:#A2B1C2;
    --qcc-border:#344657;
    --qcc-success:#78D8B3;
    --qcc-success-bg:#193A30;
    --qcc-review:#F3C66C;
    --qcc-review-bg:#3D321D;
    --qcc-danger:#FF9B91;
    --qcc-danger-bg:#442826;
  }
}
[data-previsit-hero-row="true"]{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}
.qccPrevisitHeroLogo{display:inline-flex;color:#128BED;flex:none}
html[data-theme="dark"] .qccPrevisitHeroLogo,html.dark .qccPrevisitHeroLogo{color:#55ADFF}
.qccPrevisitExperience{width:100%;box-sizing:border-box;text-align:center}
.qccPrevisitHomeSummary{max-width:620px;margin:0 auto 18px;color:var(--qcc-secondary);font-size:14px;line-height:1.7}
.qccPrevisitCapabilityMount{width:100%;padding:8px 0;box-sizing:border-box;flex:none}
.qccPrevisitCapabilities{display:flex;align-items:center;justify-content:safe center;gap:8px;width:100%;max-width:var(--dsh-composer-card-max-width,780px);margin:0 auto;padding:2px 16px 0;box-sizing:border-box;overflow-x:auto;scrollbar-width:none}
.qccPrevisitCapabilities::-webkit-scrollbar{display:none}
.qccPrevisitCapability{display:inline-flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;flex:0 0 auto;min-width:108px;min-height:54px;padding:7px 12px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:12px;cursor:pointer;transition:border-color .16s ease,color .16s ease,background .16s ease}
.qccPrevisitCapability svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.qccPrevisitCapabilityLabel{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qccPrevisitCapability:hover,.qccPrevisitCapability:focus-visible{border-color:var(--qcc-border);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPrevisitCapability:focus-visible,.qccPromptTrigger:focus-visible,.qccPromptPanel button:focus-visible,.qccPromptPanel input:focus-visible,.qccPwShell button:focus-visible{outline:2px solid var(--qcc-brand);outline-offset:2px}
.qccPrevisitLauncherContent{display:inline-flex;align-items:center;gap:9px;color:inherit}
.qccPrevisitLauncherContent svg{color:var(--qcc-brand);flex:none}

[data-composer-card]:has(.qccPromptTrigger){padding-top:48px}
.qccPromptLayer{position:absolute;inset:0;z-index:40;pointer-events:none}
.qccPromptTrigger{position:absolute;top:10px;left:16px;display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:3px 10px;border:1px solid var(--qcc-border);border-radius:6px;background:var(--qcc-selected);color:var(--qcc-action);font:inherit;font-size:12px;font-weight:600;cursor:pointer;pointer-events:auto}
.qccPromptTrigger:hover{background:var(--qcc-selected);border-color:var(--qcc-brand)}
.qccPromptTrigger svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qccPromptBackdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:rgba(15,24,32,.46);backdrop-filter:blur(2px)}
.qccPromptPanel{display:flex;flex-direction:column;min-width:0;width:min(760px,calc(100vw - 32px));max-width:100%;max-height:min(720px,calc(100vh - 48px));overflow:hidden;border:1px solid var(--qcc-border);border-radius:16px;background:var(--qcc-surface);box-shadow:0 24px 70px rgba(15,31,48,.24);box-sizing:border-box}
.qccPromptHead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:20px 22px 16px;border-bottom:1px solid var(--qcc-border);flex:none}
.qccPromptHead h3{margin:0;color:var(--qcc-text);font-size:19px;line-height:1.4}
.qccPromptHead p{margin:5px 0 0;color:var(--qcc-secondary);font-size:13px}
.qccPromptClose{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--qcc-secondary);font-size:24px;line-height:1;cursor:pointer}
.qccPromptClose:hover{background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptBody{min-width:0;min-height:0;width:100%;overflow:auto;padding:18px 22px;box-sizing:border-box}
.qccPromptSteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 20px}
.qccPromptSteps button{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:12px;cursor:pointer}
.qccPromptSteps button b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--qcc-page);font-size:11px}
.qccPromptSteps button[data-active="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptSteps button[data-active="true"] b{background:var(--qcc-action);color:var(--qcc-action-text)}
.qccPromptPane h4{margin:0 0 5px;font-size:16px}.qccPromptPane>p{margin:0 0 16px;color:var(--qcc-secondary);font-size:13px;line-height:1.65}
.qccPromptField{display:grid;gap:7px;color:var(--qcc-text);font-size:13px;font-weight:600}
.qccPromptField input{width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:16px;box-sizing:border-box}
.qccPromptGroup{margin:0 0 18px;padding:0;border:0}.qccPromptGroup legend{margin:0 0 9px;color:var(--qcc-text);font-size:13px;font-weight:650}
.qccPromptChoices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.qccPromptChoice{display:flex;align-items:center;gap:8px;min-height:40px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font-size:13px;cursor:pointer}
.qccPromptChoice[data-selected="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptChoice input{accent-color:var(--qcc-action)}
.qccPromptPreview{margin:14px 0 0;padding:14px;border:1px solid var(--qcc-border);border-radius:10px;background:var(--qcc-page);color:var(--qcc-text);font:inherit;font-size:13px;line-height:1.7;white-space:pre-wrap}
.qccPromptNote{padding:10px 12px;border-left:3px solid var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-secondary)!important}
.qccPromptConflict{margin-top:16px;padding:14px;border:1px solid var(--qcc-review);border-radius:10px;background:var(--qcc-review-bg);color:var(--qcc-text)}
.qccPromptConflict p{margin:5px 0 12px;font-size:13px}.qccPromptConflict>div{display:flex;justify-content:flex-end;gap:8px}
.qccPromptConflict button,.qccPromptActions button{min-height:36px;padding:0 14px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:13px;cursor:pointer}
.qccPromptConflict button.is-primary,.qccPromptActions button.is-primary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}
.qccPromptConflict button.is-primary:hover,.qccPromptActions button.is-primary:hover{border-color:var(--qcc-action-hover);background:var(--qcc-action-hover)}
.qccPromptError{margin:14px 0 0;color:var(--qcc-danger);font-size:13px}
.qccPromptActions{display:flex;justify-content:space-between;gap:10px;min-width:0;width:100%;padding:14px 22px;border-top:1px solid var(--qcc-border);background:var(--qcc-page);box-sizing:border-box;flex:none}
.qccPromptActions button:disabled{opacity:.45;cursor:not-allowed}

.qccPwShell{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;background:var(--qcc-page);color:var(--qcc-text);font-size:14px}
.qccPwHeader{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px 12px;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}
.qccPwBrand{display:flex;align-items:center;gap:11px;min-width:0}.qccPwBrandIcon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--qcc-selected);color:var(--qcc-brand);flex:none}
.qccPwBrandCopy{min-width:0}.qccPwTitleRow{display:flex;align-items:center;gap:8px}.qccPwTitle{margin:0;font-size:17px;line-height:1.3}.qccPwSubtitle{margin:3px 0 0;color:var(--qcc-secondary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qccPwLiveDot{width:7px;height:7px;border-radius:50%;background:var(--qcc-secondary)}.qccPwLiveDot[data-status="running"]{background:var(--qcc-brand);box-shadow:0 0 0 4px var(--qcc-selected)}.qccPwLiveDot[data-status="ready"]{background:var(--qcc-success)}
.qccPwMeta{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}.qccPwSession{color:var(--qcc-secondary);font-size:10px}
.qccPwStatus{display:inline-flex;align-items:center;min-height:25px;padding:0 8px;border-radius:999px;background:var(--qcc-table-head);color:var(--qcc-secondary);font-size:11px;white-space:nowrap}.qccPwStatus[data-status="running"]{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStatus[data-status="ready"]{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStatus[data-status="failed"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}
.qccPwTabs{display:flex;gap:22px;padding:0 18px;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwTabs button{position:relative;min-height:39px;padding:0;border:0;background:transparent;color:var(--qcc-secondary);font:inherit;font-size:13px;cursor:pointer}.qccPwTabs button[data-selected="true"]{color:var(--qcc-action);font-weight:650}.qccPwTabs button[data-selected="true"]::after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:var(--qcc-action);content:""}
.qccPwStages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-height:78px;padding:0;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);overflow:hidden;flex:none}
.qccPwStage{position:relative;display:flex;min-width:0;min-height:78px;align-items:center;justify-content:center;flex-direction:column;gap:7px;padding:9px 5px;border:0;border-right:1px solid var(--qcc-border);background:transparent;color:var(--qcc-secondary);font:inherit;text-align:center;cursor:pointer}.qccPwStage:last-child{border-right:0}.qccPwStage:hover{background:var(--qcc-page);color:var(--qcc-text)}.qccPwStage[data-selected="true"]{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStage[data-selected="true"]::after{position:absolute;right:10px;bottom:-1px;left:10px;height:3px;border-radius:3px 3px 0 0;background:var(--qcc-action);content:""}
.qccPwStageIcon{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);flex:0 0 30px}.qccPwStage[data-selected="true"] .qccPwStageIcon{background:var(--qcc-selected)}.qccPwStage[data-progress="done"] .qccPwStageIcon{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStage[data-progress="failed"] .qccPwStageIcon{background:var(--qcc-danger-bg);color:var(--qcc-danger)}
.qccPwIcon{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
.qccPwStageCopy{display:block;min-width:0;max-width:100%}.qccPwStageCopy strong{display:block;overflow:hidden;font-size:12px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}
.qccPwBody{min-height:0;padding:16px;overflow:auto;flex:1}.qccPwPanel{display:grid;gap:13px;max-width:960px;margin:0 auto}
.qccPwPageHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.qccPwPageHeading h2{margin:1px 0 0;font-size:19px}.qccPwPageHeading p:not(.qccPwEyebrow){margin:4px 0 0;color:var(--qcc-secondary);font-size:12px;line-height:1.5}.qccPwEyebrow{margin:0;color:var(--qcc-action);font-size:10px;font-weight:750;letter-spacing:.12em}.qccPwTaskId{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);color:var(--qcc-secondary);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
.qccPwCard{padding:15px;border:1px solid var(--qcc-border);border-radius:12px;background:var(--qcc-surface)}.qccPwCardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.qccPwCardHeader h3{margin:0;font-size:14px}.qccPwCardHeader p{margin:4px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.5}.qccPwMode{padding:3px 7px;border-radius:999px;background:var(--qcc-selected);color:var(--qcc-action);font-size:10px;white-space:nowrap}
.qccPwFeedback{display:flex;align-items:flex-start;gap:10px;padding:12px 13px;border:1px solid var(--qcc-border);border-radius:10px;background:var(--qcc-table-head)}.qccPwFeedback[data-tone="success"]{border-color:var(--qcc-success);background:var(--qcc-success-bg)}.qccPwFeedback[data-tone="error"]{border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwFeedbackIcon{color:var(--qcc-action);flex:none}.qccPwFeedback[data-tone="success"] .qccPwFeedbackIcon{color:var(--qcc-success)}.qccPwFeedback[data-tone="error"] .qccPwFeedbackIcon{color:var(--qcc-danger)}.qccPwFeedback strong{font-size:13px}.qccPwFeedback p{margin:3px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.55}
.qccPwSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0;padding:0;list-style:none}.qccPwStep{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-surface)}.qccPwStepDot{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:var(--qcc-page);color:var(--qcc-secondary);font-size:10px;flex:none}.qccPwStep[data-state="done"] .qccPwStepDot{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStep[data-state="running"] .qccPwStepDot{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStepCopy{display:grid;gap:3px}.qccPwStepCopy b{font-size:11px}.qccPwStepCopy small{color:var(--qcc-secondary);font-size:9px}
.qccPwDims{display:flex;flex-wrap:wrap;gap:7px}.qccPwDim{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;color:var(--qcc-secondary);font-size:11px}.qccPwDim[data-status="done"]{border-color:var(--qcc-success);background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwDim[data-status="running"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwEmpty,.qccPwNote{margin:0;color:var(--qcc-secondary);font-size:12px;line-height:1.65}.qccPwNote{padding:10px 12px;border-left:3px solid var(--qcc-brand);background:var(--qcc-selected)}
.qccPwStateStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.qccPwState{padding:7px;border:1px solid var(--qcc-border);border-radius:7px;color:var(--qcc-secondary);font-size:10px;text-align:center}.qccPwState[data-hit="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action);font-weight:650}
.qccPwHypos{display:grid;gap:8px;margin:0;padding:0;list-style:none}.qccPwHypos li{display:grid;grid-template-columns:auto auto 1fr;align-items:start;gap:8px;padding:9px;border-radius:8px;background:var(--qcc-page);font-size:11px;line-height:1.55}.qccPwPri{padding:2px 5px;border-radius:5px;background:var(--qcc-table-head);color:var(--qcc-secondary)}.qccPwPri[data-p="P0"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwPri[data-p="P1"]{background:var(--qcc-review-bg);color:var(--qcc-review)}
.qccPwRiskTiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwRiskTile{padding:11px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-page)}.qccPwRiskTileTop{display:flex;justify-content:space-between;gap:8px}.qccPwRiskTileTop b,.qccPwRiskTileTop strong{font-size:12px}.qccPwRiskTile p{margin:6px 0 0;color:var(--qcc-secondary);font-size:10px;line-height:1.5}.qccPwRiskTile[data-level="红线"]:not([data-empty="true"]){border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwRiskTile[data-level="关注"]:not([data-empty="true"]){border-color:var(--qcc-review);background:var(--qcc-review-bg)}
.qccPwDeliverables{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.qccPwDeliverable{display:flex;align-items:flex-start;gap:9px;padding:9px;border-radius:8px;background:var(--qcc-page)}.qccPwDeliverable>span{color:var(--qcc-action);font-weight:700}.qccPwDeliverable div{display:grid;gap:3px}.qccPwDeliverable b{font-size:11px}.qccPwDeliverable small{color:var(--qcc-secondary);font-size:9px;line-height:1.45}
.qccPwCoverage{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwMetric{display:grid;gap:4px;padding:12px;border-radius:9px;background:var(--qcc-table-head);text-align:center}.qccPwMetric strong{color:var(--qcc-action);font-size:19px}.qccPwMetric span{color:var(--qcc-secondary);font-size:10px}
.qccPwScopeList{display:grid;gap:0;margin:0}.qccPwScopeList>div{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--qcc-border)}.qccPwScopeList>div:last-child{border-bottom:0}.qccPwScopeList dt{color:var(--qcc-secondary);font-size:12px}.qccPwScopeList dd{margin:0;color:var(--qcc-text);font-size:12px}
.qccPwPrompt{max-height:220px;margin:0;padding:11px;border-radius:8px;background:var(--qcc-page);color:var(--qcc-secondary);font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}
.qccPwFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;border-top:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwFooterHint{min-width:0;color:var(--qcc-secondary);font-size:10px}.qccPwFooterHint[data-tone="error"]{color:var(--qcc-danger)}.qccPwFooterActions{display:flex;gap:8px;flex:none}.qccPwPrimary,.qccPwSecondary{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 13px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:12px;cursor:pointer}.qccPwPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}.qccPwPrimary:hover{border-color:var(--qcc-action-hover);background:var(--qcc-action-hover)}.qccPwPrimary[aria-disabled="true"]{border-color:var(--qcc-border);background:var(--qcc-page);color:var(--qcc-secondary)}.qccPwPrimary[aria-disabled="true"]:hover{border-color:var(--qcc-border);background:var(--qcc-page);color:var(--qcc-secondary)}.qccPwSecondary:hover{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwReportCard{padding:0;overflow:hidden}.qccPwReportFrame{display:block;width:100%;min-height:480px;border:0;background:#fff}

.qccDockBody{display:grid;gap:12px}.qccDockRow{display:grid;grid-template-columns:68px 1fr;align-items:start;gap:10px}.qccDockLabel{padding-top:7px;color:var(--qcc-secondary);font-size:12px}.qccDockCompany{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:16px;box-sizing:border-box}.qccDockChips{display:flex;flex-wrap:wrap;gap:7px}.qccDockChip{min-height:32px;padding:0 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:11px;cursor:pointer}.qccDockChip[data-selected="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccDockFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}.qccDockHint{color:var(--qcc-secondary);font-size:10px;line-height:1.45}.qccDockHint[data-tone="error"]{color:var(--qcc-danger)}.qccDockActions{display:flex;gap:7px;flex:none}.qccDockBtn{min-height:34px;padding:0 11px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:11px;cursor:pointer}.qccDockPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}

@media(max-width:760px){
  .qccPrevisitCapabilities{justify-content:flex-start;padding-inline:12px}.qccPrevisitCapability{min-width:92px;padding-inline:10px}
  .qccPromptBackdrop{padding:0;overflow:hidden}.qccPromptPanel{width:100%;max-width:100vw;max-height:100dvh;height:100dvh;border:0;border-radius:0}.qccPromptHead,.qccPromptBody,.qccPromptActions{min-width:0;width:100%;padding-inline:16px;box-sizing:border-box}.qccPromptHead>div{min-width:0}.qccPromptChoices{grid-template-columns:repeat(2,minmax(0,1fr))}.qccPromptSteps button{justify-content:center}.qccPromptSteps button span{display:none}
  .qccPwHeader{align-items:flex-start}.qccPwSession{display:none}.qccPwStage{min-height:66px;gap:5px;padding:7px 3px}.qccPwStageIcon{width:25px;height:25px;flex-basis:25px}.qccPwStageCopy strong{font-size:10px}.qccPwStage[data-selected="true"]::after{right:6px;left:6px}.qccPwBody{padding:12px}.qccPwSteps{grid-template-columns:repeat(2,1fr)}.qccPwFooter{align-items:flex-end}.qccPwFooterHint{display:none}.qccPwDeliverables{grid-template-columns:1fr}.qccDockRow{grid-template-columns:1fr}.qccDockLabel{padding:0}.qccDockFoot{align-items:stretch;flex-direction:column}.qccDockActions{justify-content:flex-end}
}
@media(max-width:430px){.qccPromptChoices{grid-template-columns:1fr}.qccPwRiskTiles,.qccPwCoverage,.qccPwStateStrip{grid-template-columns:repeat(2,1fr)}.qccPwSubtitle{max-width:190px}}
@media(prefers-reduced-motion:reduce){.qccPwShell *,.qccPromptPanel *,.qccPrevisitCapabilities *{animation:none!important;transition:none!important}}
`
