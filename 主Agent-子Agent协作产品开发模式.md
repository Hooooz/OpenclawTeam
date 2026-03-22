# 主 Agent - 子 Agent 协作产品开发模式

## 一、文档目的

本文档定义一套适用于大型软件项目的协作开发模式。该模式要求：

1. 主 Agent 负责产品定义、技术框架、测试设计和最终验收。
2. 子 Agent 负责按明确规格独立实现开发任务。
3. 主 Agent 在子 Agent 完成后统一执行浏览器测试、集成验证和结果回灌。
4. 子 Agent 根据主 Agent 的测试结果持续修复和迭代，直到通过质量闸门。

该模式适用于：

- 多模块、多阶段的大型项目
- 需求、实现、测试需要明确分层的项目
- 需要主 Agent 统一把控产品和质量边界的项目
- 需要多个子 Agent 在受控边界内执行开发的项目

## 二、核心原则

### 2.1 主 Agent 管规格，子 Agent 管实现

主 Agent 不是“最大的程序员”，而是产品与工程控制器。它负责定义：

- 产品目标
- 需求范围
- 技术边界
- 验收标准
- 测试结论

子 Agent 不是“自由发挥的开发者”，而是受规格约束的执行者。它负责：

- 在给定边界内编码
- 按要求补测试
- 响应 review
- 修复主 Agent 反馈的问题

### 2.2 先文档，后开发

任何较大任务都先由主 Agent 产出三类规格：

1. 产品文档：说明做什么、为什么做、用户价值和边界条件。
2. 技术框架：说明模块拆分、接口关系、代码落点和实现约束。
3. 测试用例：说明如何验证、覆盖哪些关键场景、失败时如何判定。

没有规格，不进入子 Agent 开发阶段。

### 2.3 子 Agent 只拿任务上下文，不继承整场历史

子 Agent 应只接收当前任务所需的最小上下文：

- 当前任务目标
- 文件范围
- 验收标准
- 相关接口或数据结构
- 不可修改的边界

不要让子 Agent 自己去“读完整项目文档再发挥”。主 Agent 必须先做提纯和分发。

### 2.4 证据先于结论

无论是主 Agent 还是子 Agent，都不得在没有新鲜验证证据的前提下声称：

- 已完成
- 已修复
- 测试通过
- 可以发布

所有完成性声明都必须满足 `verification-before-completion` 的要求。

## 三、推荐 Skill 编组

### 3.1 主 Agent 默认 Skill

- `planning-with-files`
- `writing-plans`
- `api-documentation`
- `requesting-code-review`
- `receiving-code-review`
- `verification-before-completion`
- `playwright-e2e-testing`
- `agent-browser` 或 `browser-use`

### 3.2 子 Agent 默认 Skill

- `using-superpowers`
- `subagent-driven-development`
- `test-driven-development`
- `systematic-debugging`
- `using-git-worktrees`
- `receiving-code-review`
- `verification-before-completion`

### 3.3 角色说明

`using-superpowers` 是子 Agent 的通用流程总入口。  
`subagent-driven-development` 用于将明确任务拆成实现、规格复核、代码质量复核三个环节。  
`test-driven-development` 用于约束子 Agent 先写失败测试，再补实现。  
`playwright-e2e-testing`、`agent-browser`、`browser-use` 主要由主 Agent 用于最终交互验证。  

## 四、标准开发阶段

### 阶段 0：主 Agent 建立项目工作面

主 Agent 负责：

- 明确项目目标和非目标
- 建立阶段计划
- 明确里程碑和任务分解策略
- 确定哪些任务适合派给子 Agent

输出物：

- `task_plan.md`
- `findings.md`
- `progress.md`
- 阶段路线图

### 阶段 1：主 Agent 撰写产品文档

主 Agent 负责编写：

- 产品背景
- 目标用户
- 场景定义
- 范围边界
- 版本拆分
- 验收口径

输出物建议：

- `产品背景与框架.md`
- `PRD.md`
- `需求说明.md`

### 阶段 2：主 Agent 撰写技术框架

主 Agent 负责定义：

- 系统分层
- 模块边界
- 数据流
- 接口协议
- 目录结构
- 技术约束
- 风险点和降级策略

输出物建议：

- `技术方案与开发清单.md`
- `架构设计.md`
- `接口草案.md`

### 阶段 3：主 Agent 撰写测试用例和验收集

主 Agent 负责定义：

- 冒烟测试
- 关键业务流
- 权限测试
- 错误处理
- 回归测试
- E2E 样板场景

输出物建议：

- `阶段性总结与测试用例草案.md`
- `测试计划.md`
- `验收标准.md`

### 阶段 4：主 Agent 按规格拆任务

主 Agent 把大目标拆成独立开发任务，每个任务必须包含：

- 任务编号
- 背景
- 输入和输出
- 约束条件
- 允许修改的文件
- 禁止修改的文件
- 单元测试要求
- 完成标准

此处优先使用 `writing-plans` 或现有的计划文件体系。

### 阶段 5：子 Agent 独立开发

主 Agent 使用子 Agent 分发任务时，遵循以下规则：

1. 一次只让一个实现型子 Agent 修改同一写入范围。
2. 子 Agent 不直接接管整个项目。
3. 子 Agent 只对分配给它的任务和文件负责。
4. 子 Agent 开发时默认遵循 `test-driven-development`。
5. 子 Agent 完成后必须给出：
   - 修改文件列表
   - 本地测试命令
   - 测试结果
   - 未覆盖风险

### 阶段 6：主 Agent 统一测试与验收

主 Agent 在收到子 Agent 结果后，不直接宣布完成，而是统一执行：

- 代码阅读
- 规格对照
- 构建与单测验证
- 集成测试
- 浏览器操作测试
- 端到端回归

主 Agent 在这个阶段优先使用：

- `verification-before-completion`
- `requesting-code-review`
- `playwright-e2e-testing`
- `agent-browser` 或 `browser-use`

### 阶段 7：测试结果回灌给子 Agent 修复

如果主 Agent 测试失败，不应自己直接做零散修补，而应把结果结构化地回灌给对应子 Agent：

- 失败现象
- 复现步骤
- 期望结果
- 实际结果
- 日志或截图
- 疑似影响文件

子 Agent 收到后继续按 `systematic-debugging` 和 `test-driven-development` 修复。

### 阶段 8：主 Agent 做最终关闭动作

在所有任务通过后，主 Agent 再执行：

- 最终 review
- 最终验证
- 分支整理
- 交付说明

这一阶段应配合：

- `finishing-a-development-branch`
- `verification-before-completion`

## 五、主 Agent 与子 Agent 的职责边界

### 5.1 主 Agent 负责

- 把用户目标转成产品规格
- 把产品规格转成技术框架
- 把技术框架转成可执行任务
- 控制子 Agent 的写入范围
- 审核子 Agent 结果
- 统一执行浏览器测试和最终验收
- 决定是否继续迭代

### 5.2 子 Agent 负责

- 实现分配到的任务
- 在任务范围内编写和调整代码
- 先写失败测试，再补代码
- 自测和自查
- 根据 review 和测试反馈修复问题

### 5.3 子 Agent 不负责

- 重新定义产品目标
- 擅自扩大需求范围
- 替主 Agent 做最终验收
- 在未授权范围内跨模块重构
- 跳过测试直接宣称完成

## 六、主 Agent 到子 Agent 的标准任务模板

```md
# Task: <任务标题>

## 背景
<该任务属于哪个阶段、解决什么问题>

## 目标
<本任务必须完成什么>

## 输入规格
- 产品要求：
- 技术约束：
- 验收标准：

## 文件范围
- 允许修改：
- 可以新增：
- 禁止修改：

## 实现要求
- 使用 `subagent-driven-development`
- 使用 `test-driven-development`
- 先补失败测试，再写实现
- 不要新增未要求特性

## 输出要求
完成后必须返回：
1. 修改文件列表
2. 运行过的测试命令
3. 测试结果
4. 已知风险

## 注意
- 你不是唯一在代码库中的开发者
- 不要回退他人改动
- 如缺少上下文，先提问，不要猜测
```

## 七、主 Agent 的测试回灌模板

```md
# Fix Request: <任务标题 / 缺陷标题>

## 失败类型
- 冒烟测试失败 / 集成测试失败 / 浏览器测试失败 / E2E 失败

## 复现步骤
1.
2.
3.

## 期望结果
<正确行为>

## 实际结果
<当前行为>

## 证据
- 测试命令：
- 失败日志：
- 页面截图或浏览器观察：

## 修复要求
- 只修复该问题及其必要依赖
- 补充或修正对应测试
- 不要扩大需求范围

## 返回要求
1. 修复点
2. 新增或修改的测试
3. 重新运行结果
4. 剩余风险
```

## 八、主 Agent 的浏览器测试职责

主 Agent 的浏览器测试不是“随便点一遍”，而是负责模拟真实验收过程。

主 Agent 应执行：

1. 打开目标入口。
2. 按测试用例逐步操作。
3. 对照期望结果记录偏差。
4. 收集日志、截图、页面行为、控制台异常。
5. 将失败结果结构化回灌给子 Agent。

推荐工具组合：

- 页面自动化：`agent-browser` 或 `browser-use`
- E2E 规范化回归：`playwright-e2e-testing`
- 完成前确认：`verification-before-completion`

## 九、质量闸门

### 9.1 子 Agent 提交前闸门

- 有 failing test 证据
- 有 passing test 证据
- 有本地自查结论
- 未超出任务规格

### 9.2 主 Agent 接收前闸门

- 对照产品文档检查范围
- 对照技术框架检查边界
- 对照测试用例检查覆盖
- 必要时发起 `requesting-code-review`

### 9.3 项目完成前闸门

- 关键路径测试通过
- 浏览器测试通过
- 回归验证通过
- 无未解释的高风险项
- 满足 `verification-before-completion`

## 十、推荐运行模式

### 模式 A：文档先行开发

适用于 0 到 1 项目、重构项目、企业级产品项目。

流程：

1. 主 Agent 写产品文档
2. 主 Agent 写技术框架
3. 主 Agent 写测试用例
4. 主 Agent 拆任务
5. 子 Agent 独立开发
6. 主 Agent 浏览器验收
7. 子 Agent 修复
8. 主 Agent 最终关闭

### 模式 B：多阶段迭代开发

适用于中大型持续迭代项目。

每个迭代都重复以下闭环：

1. 主 Agent 更新规格
2. 子 Agent 实现
3. 主 Agent 测试
4. 子 Agent 修复
5. 主 Agent 验收并进入下一轮

## 十一、反模式

以下行为应避免：

- 没有规格就开始派子 Agent 写代码
- 子 Agent 自己决定产品范围
- 主 Agent 把最终测试责任下放给子 Agent
- 子 Agent 没有测试就宣称完成
- 主 Agent 不做浏览器验证就合并
- 发现缺陷后主 Agent 临时手修而不回灌原子任务负责人
- 规格复核未通过就进入 code review
- code review 未通过就进入最终验收

## 十二、建议的默认协作口径

默认口径如下：

- 主 Agent 写文档、定规则、控边界、做验收。
- 子 Agent 接任务、写代码、补测试、修问题。
- 主 Agent 不替子 Agent 做开发细节。
- 子 Agent 不替主 Agent 做产品判断和最终测试。
- 所有“完成”必须以实际验证证据为准。

这套模式的目标不是让主 Agent 更忙，而是让主 Agent 始终掌握：

- 产品一致性
- 技术一致性
- 测试一致性
- 交付质量

同时把具体实现工作稳定地下放给子 Agent 并形成可迭代闭环。
