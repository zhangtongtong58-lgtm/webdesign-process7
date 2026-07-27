import type { CurrentUser } from '../composables/useAuth'

export type UserRole = 'admin' | 'member'
export type PatchStatus = 'merged' | 'pending' | 'open' | 'in_review' | 'rejected'
export type PatchPriority = 'high' | 'medium' | 'low'
export type TestStatus = 'pass' | 'fail' | 'running' | 'pending' | 'skipped'
export type PipelineStatus = 'success' | 'failed' | 'running' | 'pending' | 'cancelled'

// ─── Domain types ────────────────────────────────────────────────────────────

export interface TimelineStep {
  id: string
  label: string
  status: 'done' | 'current' | 'pending'
  startDate: string
  endDate?: string
}

export interface Project {
  id: string
  projectId: string
  name: string
  description: string
  language: string
  status: '开发中' | '测试中' | '已完成'
  ownerId: string
  memberIds: string[]
  patchCount: number
  testCount: number
  passRate: number
  createdAt: string
  lastUpdated: string
  // Detail fields
  kernelVersion: string
  osVersion: string
  owner: string
  customer: string
  productVersions: string[]
  cpuArch: string
  targetRepo: string
  forkRepo: string
  modules: string[]
  pipelineId: string
  pipelineName: string
  timeline: TimelineStep[]
}

export interface Patch {
  id: string
  projectId: string
  title: string            // 概述(SR粒度)
  description: string      // 功能介绍(AR粒度)
  authorId: string
  authorName: string
  status: PatchStatus
  priority: PatchPriority
  commitHash: string
  branch: string
  reviewers: string[]
  createdAt: string
  updatedAt: string
  // Board-specific fields
  patchType: string         // Bug_4, Feature_1
  productVersion: string
  communityIssue: string | null
  userKernel: string | null
  patchModule: string
  commitOE: string
  commitIdOE: string
  prRelated: string | null
  oeMergeTag: string
  oeLink: string
  // Extended fields
  oePR: string
  commitUpstream: string
  upstreamMergeTag: string
  mainKey: string
  merged: boolean
  customerImpact: string
  hwRepoStatus: 'merged' | 'unmerged'
  hwMergePR: string
  customerMergeStatus: string
  mergeVersion: string
  osReleaseVersion: string
}

export type LastExecResult = 'passed' | 'fail' | 'block' | 'unavailable' | 'pending'
export type TestType = 'functional' | 'performance' | 'reliability' | 'compatibility' | 'security' | 'serviceability' | 'usability'

export interface TestCase {
  id: string
  projectId: string
  patchId: string
  name: string
  status: TestStatus
  duration: number
  runAt: string
  authorId: string
  errorMessage?: string
  // Board-specific fields
  testId: string
  level: string
  precondition: string
  testSteps: string
  expectedResult: string
  automationScript: string
  isAutomated: boolean
  suite: string
  // Extended fields
  mainKey: string                    // 唯一标识符（与补丁看板 mainKey 拉通）
  lastExecResult: LastExecResult  // 最后一次执行结果
  testCaseModule: string            // 用例模块（与补丁看板 patchModule 拉通）
  lastExecutor: string             // 最后执行人
  testType: TestType               // 测试类型
}

export interface PipelineTask {
  id: string
  projectId: string
  taskId: string
  testStatus: PipelineStatus
  pipelineStatus: PipelineStatus
  packageDownloadUrl: string | null
  isoDownloadUrl: string | null
  startedAt: string
  endedAt: string | null
  duration: string | null
  executor: string
  testLink?: string
}

// ─── Mock users ──────────────────────────────────────────────────────────────

export const MOCK_USERS: CurrentUser[] = [
  {
    id: 'u1', name: '张明', email: '',
    avatar: '', role: 'admin', projectIds: ['p1', 'p2', 'p3'],
  },
  {
    id: 'u2', name: '李开发', email: 'dev@pipeline.dev',
    avatar: '', role: 'member', projectIds: ['p1', 'p3'],
  },
]

// ─── Mock projects ────────────────────────────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1', projectId: 'PRJ-001',
    name: 'Kernel-5.10', description: '内核5.10主线维护',
    language: 'C', status: '开发中', ownerId: 'u1',
    memberIds: ['u1', 'u2'], patchCount: 18, testCount: 33, passRate: 94,
    createdAt: '2025-01-15', lastUpdated: '2026-05-30',
    kernelVersion: '5.10', osVersion: 'openEuler 24.03 LTS',
    owner: '张明', customer: '华为', productVersions: ['950'], cpuArch: 'x86_64',
    targetRepo: 'https://gitcode.com/openeuler/kernel',
    forkRepo: 'https://gitcode.com/zhangming/kernel',
    modules: ['ACC', 'PCIe', 'ZIP', 'UACCE'],
    pipelineId: 'PL-001', pipelineName: 'Kernel-5.10 自动编译流水线',
    timeline: [
      { id: 'ts1', label: '启动', status: 'done', startDate: '2025-01-15' },
      { id: 'ts2', label: '开发', status: 'current', startDate: '2025-02-01', endDate: '2025-03-01' },
      { id: 'ts3', label: '测试', status: 'pending', startDate: '2025-04-01', endDate: '2025-05-15' },
      { id: 'ts4', label: '交付', status: 'pending', startDate: '2025-05-30' },
    ],
  },
  {
    id: 'p2', projectId: 'PRJ-002',
    name: 'Network-Stack-v2', description: '下一代网络协议栈重构，支持QUIC/HTTP3',
    language: 'Go', status: '测试中', ownerId: 'u1',
    memberIds: ['u1'], patchCount: 6, testCount: 12, passRate: 87,
    createdAt: '2025-03-20', lastUpdated: '2026-05-28',
    kernelVersion: '6.6', osVersion: 'openEuler 24.03 LTS',
    owner: '张明', customer: '华为', productVersions: ['950', '920'], cpuArch: 'aarch64',
    targetRepo: 'https://gitcode.com/openeuler/network-stack',
    forkRepo: 'https://gitcode.com/zhangming/network-stack',
    modules: ['Network', 'QUIC', 'HTTP3'],
    pipelineId: 'PL-002', pipelineName: 'Network-Stack 编译流水线',
    timeline: [
      { id: 'ts1', label: '启动', status: 'done', startDate: '2025-03-20' },
      { id: 'ts2', label: '开发', status: 'current', startDate: '2025-04-01', endDate: '2025-06-01' },
      { id: 'ts3', label: '测试', status: 'pending', startDate: '2025-07-01', endDate: '2025-08-15' },
      { id: 'ts4', label: '交付', status: 'pending', startDate: '2025-08-30' },
    ],
  },
  {
    id: 'p3', projectId: 'PRJ-003',
    name: 'Security-Hardening', description: '安全加固补丁集，修复CVE合规漏洞',
    language: 'C++', status: '已完成', ownerId: 'u1',
    memberIds: ['u1', 'u2'], patchCount: 24, testCount: 88, passRate: 98,
    createdAt: '2024-11-05', lastUpdated: '2026-06-01',
    kernelVersion: '5.10', osVersion: 'openEuler 22.03 LTS',
    owner: '张明', customer: '华为', productVersions: ['950'], cpuArch: 'x86_64',
    targetRepo: 'https://gitcode.com/openeuler/security-hardening',
    forkRepo: 'https://gitcode.com/zhangming/security-hardening',
    modules: ['UACCE', 'Crypto', 'DPC'],
    pipelineId: '', pipelineName: '',
    timeline: [
      { id: 'ts1', label: '启动', status: 'done', startDate: '2024-11-05' },
      { id: 'ts2', label: '开发', status: 'done', startDate: '2024-12-01', endDate: '2025-02-01' },
      { id: 'ts3', label: '测试', status: 'current', startDate: '2025-03-01', endDate: '2025-05-15' },
      { id: 'ts4', label: '交付', status: 'pending', startDate: '2025-05-30' },
    ],
  },
]

// ─── Mock patches ─────────────────────────────────────────────────────────────

export const MOCK_PATCHES: Patch[] = [
  {
    id: 'pa1', projectId: 'p1',
    title: 'DAA算子内核态驱动支持', description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    authorId: 'u2', authorName: '李开发', status: 'merged', priority: 'high',
    commitHash: 'a1b2c3d', branch: 'fix/daa-driver',
    reviewers: ['u1'], createdAt: '2026-05-10', updatedAt: '2026-05-20',
    patchType: 'Bug_4', productVersion: '950', communityIssue: null,
    userKernel: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon - enable error reporting again',
    commitIdOE: '5f3a1b2c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '80736a97cf94eeb02da6de6cfbc5a74514c85a16',
    upstreamMergeTag: 'v6.18-rc1',
    mainKey: '321138:13916',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'merged', hwMergePR: '',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa2', projectId: 'p1',
    title: 'DAA算子内核态驱动支持', description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    authorId: 'u2', authorName: '李开发', status: 'merged', priority: 'high',
    commitHash: 'e4f5a6b', branch: 'fix/daa-driver-2',
    reviewers: ['u1'], createdAt: '2026-05-12', updatedAt: '2026-05-22',
    patchType: 'Bug_5', productVersion: '950', communityIssue: null,
    userKernel: null, patchModule: 'ACC',
    commitOE: 'crypto: hisilicon/zip - do not expose hashagg algorithm when uacce mode is 2',
    commitIdOE: '3e7c9d1a2b4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
    prRelated: null, oeMergeTag: '6.6.0-94.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/16483',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '321139:14005',
    merged: true, customerImpact: '无影响', hwRepoStatus: 'merged', hwMergePR: '',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa3', projectId: 'p1',
    title: 'DAA算子内核态驱动支持', description: '内核ZIP驱动支持hash-agg算法类型对UACCE呈现',
    authorId: 'u1', authorName: '张明', status: 'pending', priority: 'medium',
    commitHash: 'c7d8e9f', branch: 'fix/daa-driver-3',
    reviewers: [], createdAt: '2026-05-15', updatedAt: '2026-05-25',
    patchType: 'Bug_7', productVersion: '950', communityIssue: null,
    userKernel: null, patchModule: 'ACC',
    commitOE: 'misc: uacce - fix a null pointer access issue when poweroff',
    commitIdOE: '8a2b4c6d1e3f5a7b9c0d2e4f6a8b0c1d3e5f7a9b1c',
    prRelated: null, oeMergeTag: '6.6.0-119.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/18980',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '324123:14218',
    merged: false, customerImpact: '修复空指针崩溃', hwRepoStatus: 'unmerged', hwMergePR: '',
    customerMergeStatus: '未合入', mergeVersion: '', osReleaseVersion: '',
  },
  {
    id: 'pa4', projectId: 'p1',
    title: 'PCIe DPC中断注册优化', description: 'PCIe DPC中断注册机制改进，支持中断累加',
    authorId: 'u1', authorName: '张明', status: 'merged', priority: 'medium',
    commitHash: 'f1a2b3c', branch: 'feat/pcie-dpc',
    reviewers: ['u2'], createdAt: '2026-04-20', updatedAt: '2026-05-01',
    patchType: 'Feature_1', productVersion: '950', communityIssue: 'I9X2K1',
    userKernel: '内核', patchModule: 'PCIe',
    commitOE: 'pcie/portdrv: add DPC interrupt support for RC port',
    commitIdOE: '1c3e5a7b9d1f2a4b6c8e0d2f4a6b8c0e2d4f6a8b0c2',
    prRelated: null, oeMergeTag: '6.6.0-90.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/15200',
    commitUpstream: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    upstreamMergeTag: 'v6.17-rc2', mainKey: '318456:12001',
    merged: true, customerImpact: '提升中断注册可靠性', hwRepoStatus: 'merged', hwMergePR: '',
    customerMergeStatus: '已合入', mergeVersion: 'main-5.10', osReleaseVersion: '24.03-LTS',
  },
  {
    id: 'pa5', projectId: 'p1',
    title: 'ZIP压缩性能基准优化', description: 'ZIP驱动压缩性能基准测试路径优化',
    authorId: 'u2', authorName: '李开发', status: 'pending', priority: 'low',
    commitHash: 'd4e5f6a', branch: 'perf/zip-bench',
    reviewers: ['u1'], createdAt: '2026-05-28', updatedAt: '2026-06-01',
    patchType: 'Bug_3', productVersion: '950', communityIssue: null,
    userKernel: null, patchModule: 'ZIP',
    commitOE: 'crypto: hisilicon/zip - fix perf benchmark path',
    commitIdOE: '4d6f8a0b2c4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6',
    prRelated: null, oeMergeTag: '6.6.0-120.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/19100',
    commitUpstream: '', upstreamMergeTag: '', mainKey: '325001:14500',
    merged: false, customerImpact: '性能提升约3%', hwRepoStatus: 'unmerged', hwMergePR: '',
    customerMergeStatus: '未合入', mergeVersion: '', osReleaseVersion: '',
  },
  // p3 patches
  {
    id: 'pa6', projectId: 'p3',
    title: 'UACCE设备注册加固', description: 'UACCE设备注册流程安全性加固',
    authorId: 'u1', authorName: '张明', status: 'merged', priority: 'high',
    commitHash: 'g7h8i9a', branch: 'sec/uacce-reg',
    reviewers: ['u2'], createdAt: '2026-05-01', updatedAt: '2026-05-10',
    patchType: 'Bug_12', productVersion: '950', communityIssue: 'CVE-2026-1234',
    userKernel: '内核', patchModule: 'UACCE',
    commitOE: 'uacce: fix device registration security issue',
    commitIdOE: '7e9a1c3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e',
    prRelated: null, oeMergeTag: '6.6.0-95.0.0', oeLink: 'gitc',
    oePR: 'https://gitcode.com/openeuler/kernel/pull/17000',
    commitUpstream: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    upstreamMergeTag: 'v6.16-rc3', mainKey: '320001:13000',
    merged: true, customerImpact: '修复安全漏洞', hwRepoStatus: 'merged', hwMergePR: '',
    customerMergeStatus: '已合入', mergeVersion: 'sec-5.10', osReleaseVersion: '22.03-LTS-SP3',
  },
]

// ─── Mock test cases ──────────────────────────────────────────────────────────

export const MOCK_TEST_CASES: TestCase[] = [
  {
    id: 'tc1', projectId: 'p1', patchId: 'pa4',
    name: 'DPC中断注册验证', testId: 'PCIE_DPC_FUNC_003',
    mainKey: '318456:12001',
    level: 'Level 0/1/2/3', suite: 'functional', status: 'pass',
    duration: 0.12, runAt: '2026-05-30 14:22', authorId: 'u2', isAutomated: true,
    precondition: '【测试组网】\n1、单板经PCIe插槽和PCIe接口卡互联；\n2、测试PC经网口和串口访问单板；\n【测试准备】\n1、单板正常启动；2.bios开启DPC',
    testSteps: '1、lspci查询RP DPC cap MSI vector配置\nlspci -s 00:00.0 -vvv| grep DpcCap\n2、查询DPC中断是否注册成功\ncat /proc/interrupts | grep dpc',
    expectedResult: '中断注册成功，中断有增加',
    automationScript: 'D06:/test_cases/pcie/DPC/test_function_dpc.py::TestCase::test_dpc',
    lastExecResult: 'passed', testCaseModule: 'PCIe', lastExecutor: 'xws0058756', testType: 'functional',
  },
  {
    id: 'tc2', projectId: 'p1', patchId: 'pa5',
    name: 'ZIP压缩基准测试', testId: 'ZIP_PERF_BENCH_001',
    mainKey: '325001:14500',
    level: 'Level 1/2', suite: 'performance', status: 'pass',
    duration: 5.2, runAt: '2026-05-28 10:15', authorId: 'u2', isAutomated: true,
    precondition: '加速卡驱动已加载，ZIP功能正常，测试环境就绪',
    testSteps: '1、运行ZIP压缩基准测试脚本\n2、记录压缩吞吐率和延迟数据',
    expectedResult: '压缩速率≥预期基线，延迟在合理范围内',
    automationScript: 'D06:/test_cases/zip/perf/test_zip_bench.py::TestCase::test_bench',
    lastExecResult: 'passed', testCaseModule: 'ZIP', lastExecutor: 'xws0058756', testType: 'performance',
  },
  {
    id: 'tc3', projectId: 'p1', patchId: 'pa1',
    name: 'UACCE设备注册', testId: 'UACCE_FUNC_001',
    mainKey: '321138:13916',
    level: 'Level 1', suite: 'functional', status: 'pass',
    duration: 0.35, runAt: '2026-05-27 16:00', authorId: 'u1', isAutomated: true,
    precondition: '系统启动正常，驱动加载完成',
    testSteps: '1、检查UACCE设备节点是否存在\n2、执行UACCE注册验证脚本',
    expectedResult: 'UACCE设备注册成功，设备节点正常',
    automationScript: 'D06:/test_cases/uacce/test_uacce_func.py::TestCase::test_register',
    lastExecResult: 'passed', testCaseModule: 'UACCE', lastExecutor: 'lkf0012345', testType: 'functional',
  },
  {
    id: 'tc4', projectId: 'p1', patchId: 'pa2',
    name: 'hash-agg算法UACCE模式验证', testId: 'ZIP_FUNC_002',
    mainKey: '321139:14005',
    level: 'Level 1/2', suite: 'functional', status: 'fail',
    duration: 1.8, runAt: '2026-06-01 09:30', authorId: 'u2', isAutomated: true,
    errorMessage: 'Expected hash-agg support in UACCE mode 1, got unsupported',
    precondition: 'UACCE mode=1，ZIP驱动加载',
    testSteps: '1、配置UACCE模式为1\n2、执行hash-agg算法测试',
    expectedResult: 'hash-agg算法在UACCE mode=1下正常工作',
    automationScript: 'D06:/test_cases/zip/func/test_hashagg.py::TestCase::test_mode1',
    lastExecResult: 'fail', testCaseModule: 'ZIP', lastExecutor: 'xws0058756', testType: 'functional',
  },
  {
    id: 'tc5', projectId: 'p1', patchId: 'pa3',
    name: '驱动加载可靠性测试', testId: 'ACC_RELI_001',
    mainKey: '324123:14218',
    level: 'Level 1', suite: 'reliability', status: 'pass',
    duration: 120.5, runAt: '2026-05-29 08:00', authorId: 'u1', isAutomated: true,
    precondition: '系统正常启动，测试环境已搭建',
    testSteps: '1、循环加载/卸载驱动100次\n2、检查每次加载后设备状态',
    expectedResult: '驱动100次加载/卸载无异常，设备状态正常',
    automationScript: 'D06:/test_cases/acc/reliability/test_drv_reload.py::TestCase::test_reload',
    lastExecResult: 'passed', testCaseModule: 'ACC', lastExecutor: 'lkf0012345', testType: 'reliability',
  },
  {
    id: 'tc6', projectId: 'p1', patchId: 'pa4',
    name: 'PCIe兼容性测试-服务器A', testId: 'PCIE_COMPAT_001',
    mainKey: '318456:12002',
    level: 'Level 2', suite: 'compatibility', status: 'pass',
    duration: 8.0, runAt: '2026-05-31 14:00', authorId: 'u1', isAutomated: false,
    precondition: '目标服务器A已就绪，PCIe设备已安装',
    testSteps: '1、在服务器A上安装PCIe卡\n2、执行基础功能验证\n3、记录兼容性结果',
    expectedResult: 'PCIe卡在服务器A上功能正常，无兼容性问题',
    automationScript: '—',
    lastExecResult: 'passed', testCaseModule: 'PCIe', lastExecutor: 'zmd9876543', testType: 'compatibility',
  },
  {
    id: 'tc7', projectId: 'p1', patchId: 'pa1',
    name: '安全边界访问测试', testId: 'SEC_BOUND_001',
    mainKey: '321138:13917',
    level: 'Level 1', suite: 'security', status: 'pending',
    duration: 0, runAt: '—', authorId: 'u2', isAutomated: true,
    precondition: '安全测试环境隔离，待执行',
    testSteps: '1、尝试越界内存访问\n2、验证内核保护机制响应',
    expectedResult: '越界访问被拦截，无内核崩溃',
    automationScript: 'D06:/test_cases/security/test_boundary.py::TestCase::test_oob',
    lastExecResult: 'unavailable', testCaseModule: 'ACC', lastExecutor: '—', testType: 'security',
  },
  {
    id: 'tc7b', projectId: 'p1', patchId: 'pa1',
    name: 'PCIe设备热插拔阻塞测试', testId: 'PCIE_HOT_002',
    mainKey: '321138:13918',
    level: 'Level 2', suite: 'PCIe', status: 'block',
    duration: 0, runAt: '2026-05-28 09:30', authorId: 'u3', isAutomated: true,
    precondition: 'PCIe热插拔环境就绪，驱动加载阻塞',
    testSteps: '1、执行PCIe设备热插拔\n2、观察内核响应状态',
    expectedResult: '热插拔过程无panic，设备状态正常',
    automationScript: 'D06:/test_cases/pcie/test_hotplug_block.py::TestCase::test_hotplug',
    lastExecResult: 'block', testCaseModule: 'PCIe', lastExecutor: 'zmd9876543', testType: 'functional',
  },
  {
    id: 'tc8', projectId: 'p3', patchId: 'pa6',
    name: 'UACCE注册安全验证', testId: 'SEC_UACCE_001',
    mainKey: '320001:13000',
    level: 'Level 1', suite: 'security', status: 'pass',
    duration: 0.28, runAt: '2026-05-10 16:05', authorId: 'u1', isAutomated: true,
    precondition: '系统正常启动，安全加固补丁已应用',
    testSteps: '1、执行UACCE注册场景边界测试\n2、验证空指针保护',
    expectedResult: '空指针场景不触发panic，异常处理正确',
    automationScript: 'D06:/test_cases/security/test_uacce_sec.py::TestCase::test_null_ptr',
    lastExecResult: 'passed', testCaseModule: 'UACCE', lastExecutor: 'zmd9876543', testType: 'security',
  },
]

// ─── Mock pipeline tasks ──────────────────────────────────────────────────────

export const MOCK_PIPELINE_TASKS: PipelineTask[] = [
  {
    id: 'pt1', projectId: 'p1', taskId: '123456789',
    testStatus: 'success', pipelineStatus: 'success',
    packageDownloadUrl: 'https://repo.openeuler.org/packages/123456789',
    isoDownloadUrl: 'https://iso.openeuler.org/download/123456789',
    startedAt: '2026.5.22 18:29', endedAt: '2026.5.22 19:29',
    duration: '1:00', executor: 'xws0058756',
    testLink: 'https://test.openeuler.org/123456789',
  },
  {
    id: 'pt2', projectId: 'p1', taskId: '987654321',
    testStatus: 'pending', pipelineStatus: 'running',
    packageDownloadUrl: null, isoDownloadUrl: null,
    startedAt: '2026.5.22 20:00', endedAt: null,
    duration: null, executor: 'xws0058756',
  },
  {
    id: 'pt3', projectId: 'p3', taskId: '112233445',
    testStatus: 'failed', pipelineStatus: 'failed',
    packageDownloadUrl: 'https://repo.openeuler.org/packages/112233445',
    isoDownloadUrl: 'https://iso.openeuler.org/download/112233445',
    startedAt: '2026.6.01 10:00', endedAt: '2026.6.01 11:30',
    duration: '1:30', executor: 'xws0058756',
  },
]
