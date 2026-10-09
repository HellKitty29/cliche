import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/PreWpJuly.tsx', import.meta.url), 'utf8');

assert.ok(
  source.includes("procedure: '根据了解到的被审计单位存货性质信息进行勾选，获悉项目组在设计或执行程序时应考虑的因素'"),
  'question 1 should use the requested topic text'
);

const expectedOptionGroups = [
  ['1.1', '被审计单位的存货是否存放在多个地点？', "Object.freeze(['是', '否'])"],
  ['1.2', '勾选被审计单位的存货类型及存储方式？', '散货集装箱中的存货'],
  ['1.3', '被审计单位是否持有如下特殊类型的存货？如有，请勾选。', '地下管道里的油、气或海底线缆等'],
  ['1.4', '被审计单位是否聘请外部专业机构（例如专业测量公司）协助进行存货盘点？', "selection: 'single'"],
  ['1.5', '被审计单位是否存在高度自动化仓库？如有，请勾选。', '完全自动化仓库'],
  ['1.6', '被审计单位仓库中是否存在所有权不属于被审计单位的存货', "selection: 'single'"],
];

for (const [id, question, optionMarker] of expectedOptionGroups) {
  assert.ok(source.includes(`id: '${id}'`), `question ${id} should be present`);
  assert.ok(source.includes(question), `question ${id} should use the requested text`);
  assert.ok(source.includes(optionMarker), `question ${id} should include its requested options`);
}

assert.match(
  source,
  /function ConnectedOptionGroup[\s\S]*aria-pressed=\{isSelected\}[\s\S]*bg-\[#00338D\] text-white/,
  'selected options should use a blue background'
);

assert.match(
  source,
  /isSingleChoice && \([\s\S]*multiple=\{false\}[\s\S]*compact[\s\S]*hasOptions && !isSingleChoice[\s\S]*col-start-2 row-start-2[\s\S]*multiple/,
  'yes/no and multi-select options should preserve their selection behavior below each question'
);

assert.match(
  source,
  /multiple[\s\S]*flex w-full flex-wrap gap-2[\s\S]*multiple \? 'w-auto rounded-md'/,
  'multi-select options should use separate, content-width cells with gaps and natural wrapping'
);

assert.match(
  source,
  /grid w-\[70%\][\s\S]*isSingleChoice && \([\s\S]*col-start-2 row-start-2[\s\S]*multiple=\{false\}/,
  'yes/no options should render on the line below the question text'
);

assert.match(
  source,
  /breakBeforeOption: '木材、钢筋盘条、管子'[\s\S]*option === breakBeforeOption[\s\S]*basis-full/,
  'the wood and steel wire rod option should start on a new row'
);

assert.ok(
  source.includes('className="space-y-6 rounded-md border border-gray-200 bg-gray-50/60 px-4 py-4"'),
  'question 1 subquestions should use increased vertical spacing'
);

assert.match(
  source,
  /const isStepTwoComplete = PRE_WP_JULY_STEP_TWO_SUBQUESTIONS\.every[\s\S]*isStepTwoComplete && \([\s\S]*confirmAndGenerateStepTwoGuidance[\s\S]*确认并生成指引/,
  'the guidance generation button should appear only after every question 1 subquestion has an answer'
);

assert.match(
  source,
  /stepTwoCarouselRef[\s\S]*scrollTo\(\{ left: targetCard\.offsetLeft, behavior: 'smooth' \}\)[\s\S]*snap-x snap-mandatory[\s\S]*overflow-x-auto[\s\S]*存货性质问卷卡片一[\s\S]*存货性质问卷卡片二/,
  'the inventory questionnaire should use a manually scrollable two-card carousel that auto-slides to card two'
);

assert.match(
  source,
  /selectedStorageMethods = selections\['1\.2'\][\s\S]*selectedSpecialInventoryTypes = selections\['1\.3'\][\s\S]*STORAGE_METHOD_GUIDANCE\.filter[\s\S]*SPECIAL_INVENTORY_GUIDANCE\.filter/,
  'card two should filter storage and special-inventory guidance from the selected answers'
);

assert.match(
  source,
  /hasMultipleLocations[\s\S]*formatNumberedGuidance\(MULTIPLE_LOCATION_COMPLETENESS_PROCEDURES\)[\s\S]*formatNumberedGuidance\(INVENTORY_COUNT_COMPLETENESS_EVIDENCE\)/,
  'selecting yes for multiple locations should generate both completeness guidance sections'
);

assert.match(
  source,
  /usesExternalProfessionalOrganization[\s\S]*EXTERNAL_PROFESSIONAL_ORGANIZATION_GUIDANCE\.join/,
  'selecting yes for question 1.4 should generate external professional organization guidance'
);

assert.match(
  source,
  /selectedAutomatedWarehouseTypes = selections\['1\.5'\][\s\S]*AUTOMATED_WAREHOUSE_GUIDANCE\.filter[\s\S]*typeHeader="自动化仓库类型"/,
  'question 1.5 selections should generate the automated warehouse guidance table'
);

assert.ok(
  source.includes("'不涉及以上性质或存储方式的存货'"),
  'question 1.3 should use the updated not-applicable option label'
);

assert.match(
  source,
  /hasThirdPartyOwnedInventory = \(selections\['1\.6'\][\s\S]*formatNumberedGuidance\(THIRD_PARTY_OWNED_INVENTORY_GUIDANCE\)/,
  'selecting yes for question 1.6 should generate the third-party-owned inventory guidance'
);

assert.match(
  source,
  /\[&::-webkit-scrollbar\]:hidden[\s\S]*scrollbarWidth: 'none'[\s\S]*group\/next[\s\S]*滑动到卡片二[\s\S]*animate-pulse/,
  'the carousel should hide its scrollbar and show an animated arrow over the right quarter of card one'
);

assert.match(
  source,
  /isStepTwoConfirmed && \([\s\S]*存货性质问卷卡片分页[\s\S]*activeStepTwoCard === cardIndex/,
  'Apple-style pagination dots should appear only after guidance has been generated'
);

assert.match(
  source,
  /isStepTwoConfirmed \? 'overflow-x-auto' : 'overflow-x-hidden'[\s\S]*isStepTwoConfirmed && activeStepTwoCard === 0[\s\S]*aria-label="滑动到卡片二"/,
  'card two navigation should remain unavailable before guidance is generated'
);

assert.match(
  source,
  /isStepTwoConfirmed && activeStepTwoCard === 1[\s\S]*group\/previous absolute inset-y-0 -left-4 z-20 flex w-\[calc\(25%\+1rem\)\][\s\S]*aria-label="返回卡片一"[\s\S]*<ChevronLeft/,
  'hovering beyond card two left edge but inside question two should reveal an explicit left arrow'
);

assert.match(
  source,
  /stepTwoQuestionCardRef[\s\S]*stepTwoGuidanceCardRef[\s\S]*ResizeObserver[\s\S]*height: stepTwoCarouselHeight/,
  'the carousel height should follow the active card so question 3 stays directly below card one'
);

assert.match(
  source,
  /group\/previous[\s\S]*返回卡片一[\s\S]*<ChevronLeft size=\{24\} className="animate-pulse"/,
  'card two should show an animated left-side return arrow'
);

assert.doesNotMatch(
  source,
  />卡片二<\/div>/,
  'card two should not show a visible card-two label'
);

assert.match(
  source,
  /relative overflow-hidden rounded-xl bg-white shadow-sm[\s\S]*absolute inset-y-0 left-0[\s\S]*bg-\[linear-gradient\(180deg,#cfd4da_0%,#00338D_7%,#00338D_93%,#cfd4da_100%\)\][\s\S]*bg-\[#e7f2fb\] text-gray-800[\s\S]*bg-\[#eef4ff\] px-3 py-3/,
  'guidance tables should use only a rounded left-side gradient decoration with light-blue header and first column fills'
);

assert.doesNotMatch(
  source,
  /inset-x-2 inset-y-2[\s\S]*border-\[#6D4AFF\]/,
  'the first column should not contain a nested decorative border'
);

assert.match(
  source,
  />项目组应关注<\/th>[\s\S]*title="1\.1[\s\S]*title="1\.2[\s\S]*title="1\.3[\s\S]*title="1\.4[\s\S]*title="1\.5[\s\S]*title="1\.6/,
  'all six guidance answers should render as tables with the same second-column header'
);

for (const guidanceLabel of [
  '被审计单位的存货未存放于多个地点',
  '此次审计不涉及在途、在产品、包装箱或散货集装箱中的存货',
  '此次审计不涉及上述特殊性质或存储方式的存货',
  '此次盘点无外部专业机构参与存货盘点',
  '被审计单位不存在高度自动化仓库',
  '不存在所有权不属于被审计单位的存货',
]) {
  assert.ok(
    source.includes(guidanceLabel),
    `negative and not-applicable guidance should include: ${guidanceLabel}`
  );
}

for (const guidanceLabel of [
  '被审计单位的存货存放于多个地点',
  '此次盘点有外部专业机构参与存货盘点',
]) {
  assert.ok(source.includes(guidanceLabel), `positive guidance should include: ${guidanceLabel}`);
}

assert.doesNotMatch(
  source,
  /可供实施的审计程序/,
  'the obsolete audit-procedure column header should no longer appear'
);

assert.match(
  source,
  /if \(isStepTwoConfirmed && isStepTwoComplete\) \{\s*setIsStepTwoCollapsed\(false\)/,
  'saving an incomplete page after guidance generation should reopen question one'
);

assert.match(
  source,
  /step\.id === 1 && isStepTwoConfirmed[\s\S]*setIsStepTwoCollapsed[\s\S]*展开审计指引[\s\S]*step\.id === 1 && !isStepTwoCollapsed/,
  'collapsed question one should retain a control for reopening its audit guidance'
);

assert.match(
  source,
  /\[2, 3, 4, 5, 6, 7, 8\]\.includes\(step\.id\)[\s\S]*<textarea/,
  'question 1 should remain excluded from the generic notes text area'
);

console.log('check passed: PreWpJuly question 1 option groups');
