# PageFlow 离线同步功能技术文档

> **适合读者**：了解 React / Next.js 基础，熟悉 Zustand，没有接触过 IndexedDB 的开发者。

---

## 目录

1. [功能背景与问题定义](#1-功能背景与问题定义)
2. [整体架构设计](#2-整体架构设计)
3. [IndexedDB 由浅入深](#3-indexeddb-由浅入深)
4. [各模块详解](#4-各模块详解)
   - 4.1 [lib/offline-storage.ts](#41-liboffline-storagets)
   - 4.2 [hooks/use-network-status.ts](#42-hooksuse-network-statusts)
   - 4.3 [hooks/use-sync-trigger.ts](#43-hooksuse-sync-triggerts)
   - 4.4 [hooks/use-offline-sync.tsx](#44-hooksuse-offline-synctsx)
   - 4.5 [app/(main)/\_components/OfflineSyncMount.tsx](#45-appmain_componentsofflinesynccmounttsx)
   - 4.6 [app/(main)/(routes)/pages/\[pageId\]/page.tsx](#46-appmainroutespagespageidpagetsx)
   - 4.7 [app/(main)/\_components/Banner.tsx](#47-appmain_componentsbannnertsx)
5. [完整数据流：三种场景演练](#5-完整数据流三种场景演练)
6. [关键设计决策与权衡](#6-关键设计决策与权衡)
7. [已覆盖的边界情况](#7-已覆盖的边界情况)
8. [文件依赖关系图](#8-文件依赖关系图)

---

## 1. 功能背景与问题定义

### 原有实现的缺陷

改造之前，保存逻辑只有一行：

```ts
// app/(main)/(routes)/pages/[pageId]/page.tsx（改造前）
const onContentChange = async (content: string) => {
  await update({ id, content }) // 直接调用 Convex
}
```

这段代码有一个致命问题：**它假设网络永远可用**。一旦用户处于以下任何情况，编辑内容就会静默丢失：

- 地铁 / 隧道中短暂断网
- Wi-Fi 信号弱，请求超时
- Convex 服务端短暂不可达
- 用户在无网络环境下离线编辑，然后关闭了标签页

### 目标

我们想实现的行为，用一句话描述：**"用户的每一次击键，内容都不会丢失"**。具体来说：

1. 编辑时无论网络如何，内容先保存到**本地**（持久化，不怕刷新/关标签页）
2. 尝试同步到 Convex，成功后清除本地草稿
3. 同步失败时，**不打扰用户继续编辑**，而是在 Banner 上静默提示
4. 网络恢复后，**自动触发**同步，无需用户干预
5. 用户也可以手动点击"Retry Sync"按钮触发
6. 下次打开该页面时，如果有未同步草稿，**优先展示草稿**（草稿比云端快照更新）

---

## 2. 整体架构设计

### 分层设计

整个方案分为四层，每一层职责单一、互不越界：

```
┌─────────────────────────────────────────────────────────┐
│  展示层 (UI)                                             │
│  Banner.tsx           ← 向用户展示网络状态和同步进度     │
│  [pageId]/page.tsx    ← 离线感知的内容保存与草稿恢复     │
├─────────────────────────────────────────────────────────┤
│  编排层 (Orchestration)                                  │
│  use-offline-sync.tsx ← 注册全局监听器、轮询调度         │
│  OfflineSyncMount.tsx ← 保证编排层在 layout 级唯一挂载   │
├─────────────────────────────────────────────────────────┤
│  状态层 (State)                                          │
│  use-network-status.ts← Zustand 全局状态（在线/待同步）  │
│  use-sync-trigger.ts  ← 同步执行器（含互斥锁）           │
├─────────────────────────────────────────────────────────┤
│  存储层 (Storage)                                        │
│  lib/offline-storage.ts ← IndexedDB 封装，持久化草稿     │
└─────────────────────────────────────────────────────────┘
```

### 核心设计原则："先写本地，再同步云端"

这是整个方案的灵魂，类似于数据库中的 **WAL（Write-Ahead Log，预写日志）** 策略：

```
用户编辑
   │
   ▼
① 写入 IndexedDB ────────── 一定成功（除非硬盘满了）
   │                         内容永久安全
   ▼
② 尝试 Convex.update()
   │
   ├─── 成功 ──▶ 删除 IndexedDB 草稿，清除 pending 标记
   │
   └─── 失败 ──▶ 保留 IndexedDB 草稿，Banner 提示用户
                  │
                  └─▶ 等待网络恢复（online 事件 / 30s 轮询）
                       ▶ 自动重试 ②
```

无论 ② 成功或失败，用户的内容在 ① 完成后就已经安全了。

---

## 3. IndexedDB 由浅入深

> 这一节专门为没有学过 IndexedDB 的读者编写，会从"什么是 IndexedDB"一步步讲到项目中的实际用法。

### 3.1 浏览器存储方案对比

在浏览器里存数据，你可能知道 `localStorage`，但它有很大的局限性：

| 特性           | localStorage               | IndexedDB               |
| -------------- | -------------------------- | ----------------------- |
| 存储容量       | ~5 MB                      | 几百 MB 到几 GB         |
| 数据类型       | 只能存字符串               | 对象、数组、二进制…都行 |
| 是否持久化     | ✅ 持久化（刷新不丢）      | ✅ 持久化（刷新不丢）   |
| 是否支持异步   | ❌ 同步（会阻塞 UI）       | ✅ 异步（不阻塞）       |
| 是否支持事务   | ❌                         | ✅                      |
| 能否存复杂数据 | ❌ 需要手动 JSON.stringify | ✅ 直接存对象           |

**结论**：对于存储编辑器内容这种大块 JSON 数据，IndexedDB 是正确选择。`localStorage` 的 5 MB 上限在用户写了大量内容后会轻松超出。

### 3.2 IndexedDB 的核心概念

把 IndexedDB 想象成**浏览器里的一个本地数据库**，它有自己的概念体系：

```
IndexedDB 实例（每个域名独立）
  └── 数据库 (Database)       ← 对应 "pageflow-offline"
       └── 对象仓库 (ObjectStore) ← 类似数据库的"表"，对应 "pending-edits"
            └── 记录 (Record)    ← 一条条数据，类似数据库的"行"
```

每条记录长这样（就是我们定义的 `PendingEdit`）：

```ts
{
  pageId: "abc123",          // 主键（keyPath），相当于主键列
  content: '{"blocks":[…]}', // 编辑器内容的 JSON 字符串
  timestamp: 1740000000000   // 保存时间戳，方便排查问题
}
```

### 3.3 IndexedDB 的"奇怪"的 API 风格

IndexedDB 的原生 API 是**基于事件回调**的，非常老式：

```ts
// 原生 API 写法 —— 很繁琐
const request = indexedDB.open('mydb', 1)
request.onsuccess = (event) => {
  const db = event.target.result
  const tx = db.transaction('mystore', 'readwrite')
  const store = tx.objectStore('mystore')
  const putReq = store.put({ id: 'a', value: 'hello' })
  putReq.onsuccess = () => console.log('saved!')
  putReq.onerror = () => console.error('failed!')
}
request.onerror = () => console.error('open failed!')
```

你会发现：没有 `async/await`，全是回调嵌套。这就是为什么我们要在 `lib/offline-storage.ts` 中**对它进行封装**，把回调包装成 Promise，让调用方可以用 `await`。

### 3.4 数据库版本与升级

IndexedDB 有一个**版本号**的概念。当你第一次打开数据库，或者升级版本号时，会触发 `onupgradeneeded` 事件，这是**创建或修改对象仓库（表结构）的唯一时机**：

```ts
request.onupgradeneeded = (e) => {
  const db = e.target.result
  // 只在这里可以创建/删除 ObjectStore
  if (!db.objectStoreNames.contains('pending-edits')) {
    db.createObjectStore('pending-edits', { keyPath: 'pageId' })
    //                                      ↑
    //                    告诉 IndexedDB：用 pageId 字段作为这条记录的"主键"
  }
}
```

`keyPath: 'pageId'` 意味着：每条记录的 `pageId` 字段自动成为主键。同一个 `pageId` 再次 `put()` 时，会**覆盖**而不是新增——这正是我们想要的行为（新草稿替换旧草稿）。

### 3.5 事务（Transaction）

IndexedDB 的所有读写操作都必须在**事务**内进行。事务有两种模式：

- `'readonly'`：只读，多个只读事务可以并发
- `'readwrite'`：读写，同一时间只允许一个

```ts
// 写操作：用 'readwrite' 模式
const tx = db.transaction('pending-edits', 'readwrite')
tx.objectStore('pending-edits').put(data)
tx.oncomplete = () => {
  /* 整个事务提交成功 */
}
tx.onerror = () => {
  /* 事务回滚 */
}
```

**为什么要监听 `tx.oncomplete` 而不是 `req.onsuccess`？**

`req.onsuccess` 只表示"这次 put 操作排队成功了"，但数据不一定已经真正写入磁盘。`tx.oncomplete` 才表示整个事务已经提交、数据已经持久化到磁盘。我们用 `tx.oncomplete` 来 resolve Promise，这样 `await savePendingEdit()` 返回时，数据一定已经安全落盘。

### 3.6 单例连接与重试机制

频繁地 open/close 数据库连接是浪费资源的。我们用一个模块级变量 `dbPromise` 来保存已建立的连接：

```ts
let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise // 复用已有连接

  dbPromise = new Promise(/* 打开数据库 */)
  return dbPromise
}
```

如果打开失败，我们把 `dbPromise` 重置为 `null`，允许下次调用重试。这是一个简单但有效的**错误恢复**模式。

---

## 4. 各模块详解

### 4.1 `lib/offline-storage.ts`

**职责**：IndexedDB 的唯一入口。上层代码不接触任何 IndexedDB 原生 API，只调用这里导出的四个函数。

```
savePendingEdit(pageId, content)   → 写入/覆盖一条草稿
getPendingEdit(pageId)             → 读取某页面的草稿（单条）
getAllPendingEdits()               → 读取所有草稿（批量同步时用）
deletePendingEdit(pageId)          → 删除某页面的草稿（同步成功后清理）
```

**关键设计点：所有函数都用 try-catch 静默降级**

```ts
export async function savePendingEdit(pageId: string, content: string): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ pageId, content, timestamp: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[PageFlow] savePendingEdit failed:', e)
    // 注意：这里没有 re-throw！
  }
}
```

如果 IndexedDB 不可用（比如用户开了无痕模式，某些浏览器会禁用 IndexedDB），函数只是打一条警告，**不会向上抛出异常**。这样上层代码（`onContentChange`）即使在 IndexedDB 失败的情况下也能继续运行，至少不影响 Convex 同步尝试。

**`getPendingEdit` 中没有 try-catch 的 console.warn？**

因为对读操作来说，失败的结果是"没有草稿"，这是一个合理的降级值。我们直接 `catch` 后返回 `undefined`，语义上等同于"没有找到草稿"，对业务逻辑完全无害。

---

### 4.2 `hooks/use-network-status.ts`

**职责**：全局单一信源（Single Source of Truth），存储所有与网络和同步相关的状态。

```ts
interface NetworkStatusStore {
  isOnline: boolean // 浏览器是否认为自己在线
  syncStatus: SyncStatus // 当前同步状态：idle/syncing/failed/success
  pendingPageIds: string[] // 哪些页面有未同步的本地草稿
  // ...actions
}
```

**为什么用 Zustand 而不是 React Context？**

- Context 每次值变更都会重新渲染所有消费者，而 Zustand 使用选择器，**只有订阅的字段变化才触发重渲染**
- Zustand 的 store 是模块级单例，可以在 hook 之外（如 `use-sync-trigger.ts` 的模块级 `isSyncing` 逻辑）共享状态
- `hasPendingPage` 是一个**读方法**而非状态字段，这样调用方不需要订阅整个 `pendingPageIds` 数组，避免了每次数组变化都触发重渲染

**SSR 安全的初始值**

```ts
isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
```

Next.js 在服务端渲染时没有 `navigator` 对象，直接访问会报错。这里用 `typeof navigator !== 'undefined'` 做安全检查，服务端渲染时默认为 `true`（假设在线），客户端 hydrate 后会读取真实值。

**`addPendingPage` 的幂等性设计**

```ts
addPendingPage: (pageId) =>
  set((state) => ({
    pendingPageIds: state.pendingPageIds.includes(pageId)
      ? state.pendingPageIds  // 已存在，直接返回原数组（引用不变，不触发重渲染）
      : [...state.pendingPageIds, pageId]
  })),
```

用户每次编辑都会调用 `addPendingPage`，但如果 `pageId` 已经在列表里了，不应该重复添加，也不应该创建新数组（那会导致不必要的重渲染）。这里先检查再决定是否更新。

---

### 4.3 `hooks/use-sync-trigger.ts`

**职责**：执行"把所有本地草稿推送到 Convex"这个具体动作。它被设计为一个**纯执行器**，不注册任何监听器，可以在任何地方被调用（Banner 的重试按钮、`online` 事件回调、定时轮询）。

**模块级互斥锁**

```ts
// 这行代码在模块的顶层，不在任何函数或组件内部
let isSyncing = false

const syncAllPending = useCallback(
  async () => {
    if (isSyncing) return // 如果已经在同步，直接跳过
    isSyncing = true

    try {
      // ... 同步逻辑
    } finally {
      isSyncing = false // 无论成功失败，最终释放锁
    }
  },
  [
    /* deps */
  ]
)
```

为什么需要这个锁？考虑以下场景：用户点击了"Retry Sync"按钮，同时 `online` 事件也触发了，两个调用同时进入 `syncAllPending`。没有锁的情况下，同一份内容会被发送两次到 Convex，造成浪费甚至可能有竞争条件。

**模块级变量（不是 `useRef`）的原因**：`useRef` 只在单个组件实例内有效。如果 `Banner` 和 `useOfflineSync` 各自调用了 `useSyncTrigger()`，它们拿到的是两个不同的 `useRef`，互斥就失效了。**模块级变量**是进程内（浏览器标签页内）全局唯一的，天然解决了跨组件的互斥问题。

**`Promise.allSettled` 而不是 `Promise.all`**

```ts
const results = await Promise.allSettled(
  pending.map(async (edit) => {
    await update({ id: edit.pageId as Id<'pages'>, content: edit.content })
    await deletePendingEdit(edit.pageId)
    removePendingPage(edit.pageId)
  })
)
```

`Promise.all` 遇到任何一个失败就会立即中止，其他页面的同步就不会执行。`Promise.allSettled` 会**等所有请求都完成**（无论成功失败），然后我们统计失败的数量：

```ts
const hasFailures = results.some((r) => r.status === 'rejected')
```

这样用户编辑了 3 个页面，2 个同步成功、1 个失败，那 2 个成功的草稿会被清除，只有那 1 个失败的还保留在 IndexedDB 中等待下次重试。

**"先删草稿再标记成功"的顺序很重要**

```ts
await update({ id, content }) // 1. Convex 确认写入
await deletePendingEdit(edit.pageId) // 2. 删除本地草稿
removePendingPage(edit.pageId) // 3. 更新 Zustand 状态
```

顺序不能颠倒。如果先删草稿，Convex 写入再失败，那数据就真的丢了。必须等服务器确认后，再清理本地副本。

---

### 4.4 `hooks/use-offline-sync.tsx`

**职责**：编排层。注册全局事件监听器和定时轮询，确保"网络恢复时自动同步"这个行为。

这个 hook 只应该在 `OfflineSyncMount` 中被调用一次，其他组件不直接使用它。

**三个 `useEffect` 各司其职**

**① 初始化（只运行一次）**

```ts
useEffect(() => {
  const init = async () => {
    const pending = await getAllPendingEdits()
    pending.forEach((edit) => addPendingPage(edit.pageId)) // 水化 Zustand
    if (navigator.onLine && pending.length > 0) {
      await syncAllPending() // 如果上次会话留下了草稿且当前在线，立即尝试同步
    }
  }
  init()
}, []) // 空依赖数组 = 只在组件挂载时运行一次
```

这解决了**跨会话恢复**的问题：假设用户昨天在地铁上编辑了内容，今天打开应用，这个 `useEffect` 会发现 IndexedDB 里有草稿，自动触发同步。

**② Online/Offline 事件监听**

```ts
useEffect(() => {
  const handleOnline = () => {
    setOnline(true)
    syncAllPending() // 网络恢复时立即同步
  }
  const handleOffline = () => {
    setOnline(false)
    setSyncStatus('idle') // 清空上次的同步状态
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    // cleanup：组件卸载时移除监听器，防止内存泄漏
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [setOnline, setSyncStatus, syncAllPending])
```

`window.addEventListener('online', ...)` 会在浏览器认为网络恢复时触发（例如从飞行模式恢复）。

**③ 30 秒轮询**

```ts
useEffect(() => {
  const interval = setInterval(() => {
    if (navigator.onLine && pendingPageIds.length > 0) {
      syncAllPending()
    }
  }, 30_000)

  return () => clearInterval(interval) // cleanup
}, [pendingPageIds.length, syncAllPending])
```

为什么需要轮询？**`navigator.onLine` 不可靠**。它只检测设备是否连接到某个网络，不检测网络是否能访问互联网。以下情况 `navigator.onLine` 是 `true`，但实际上无法同步：

- 连上了需要登录的 Wi-Fi（酒店/咖啡馆门户网）
- 信号极弱，发包成功率很低
- VPN 问题、DNS 解析失败
- Convex 服务端临时故障

轮询作为**兜底机制**，每 30 秒尝试一次，确保这些边缘情况下最终也能同步成功。

---

### 4.5 `app/(main)/_components/OfflineSyncMount.tsx`

```tsx
export const OfflineSyncMount = () => {
  useOfflineSync()
  return null
}
```

这是一个**只挂载 hook，不渲染任何 UI 的组件**。

为什么需要这个组件，而不是直接在 `layout.tsx` 里调用 `useOfflineSync()`？

因为 `layout.tsx` 本身是一个组件，在它的函数体内调用 hook 当然可以，但这会把"离线同步"这个关注点混入 layout 的代码中，降低可读性和可维护性。将其封装为 `OfflineSyncMount`，layout 里只需要放一行 `<OfflineSyncMount />`，意图一目了然。

这是 React 中**关注点分离**的常见模式。

---

### 4.6 `app/(main)/(routes)/pages/[pageId]/page.tsx`

这个文件改动最大，是整个功能与编辑器直接对接的地方。

**新增的 `localDraftContent` 状态**

```ts
// undefined = "还没检查过 IndexedDB"
// null      = "检查过了，没有草稿"
// string    = "有草稿，这是草稿内容"
const [localDraftContent, setLocalDraftContent] = useState<string | null | undefined>(undefined)
```

用三个值（`undefined` / `null` / `string`）区分三种状态，是一个常见的**状态机设计技巧**，比用两个 boolean 更清晰。

**加载时的草稿恢复逻辑**

```ts
useEffect(() => {
  getPendingEdit(id)
    .then((pending) => {
      if (pending) {
        setLocalDraftContent(pending.content) // 有草稿，保存草稿内容
        addPendingPage(id) // 标记此页面有未同步内容（会触发 Banner 显示）
      } else {
        setLocalDraftContent(null) // 没有草稿，标记"检查完毕"
      }
    })
    .catch(() => setLocalDraftContent(null)) // IndexedDB 失败，降级
}, [id, addPendingPage])
```

**渲染门卫：等两个异步操作都完成**

```ts
// 必须等 Convex 查询 AND IndexedDB 检查都完成
if (page === undefined || localDraftContent === undefined) {
  return <SkeletonUI />
}
```

`page === undefined` 表示 Convex 还在加载中。`localDraftContent === undefined` 表示 IndexedDB 检查还没完成。两者都完成后，才决定 Editor 的初始内容：

```ts
// 草稿（本地更新）优先于云端快照
const initialContent = localDraftContent ?? page.content
```

`??` 是空值合并运算符：只有 `localDraftContent` 是 `null` 或 `undefined` 时，才取右边的值。由于我们用 `null` 表示"没有草稿"，所以没有草稿时会自然 fall back 到 `page.content`。

**离线感知的 `onContentChange`**

```ts
const onContentChange = async (content: string) => {
  // ① 先写本地，不管网络
  await savePendingEdit(id, content)
  addPendingPage(id)

  try {
    // ② 尝试同步云端
    await update({ id, content })
    // ③ 成功 → 清理
    await deletePendingEdit(id)
    removePendingPage(id)
  } catch (err) {
    // ④ 失败 → 静默，Banner 会显示
    console.warn('[PageFlow] Convex sync failed – content saved locally:', err)
  }
}
```

注意 ① 没有 try-catch（因为 `savePendingEdit` 内部已经处理了所有异常）。这意味着：即使 ① 的 `savePendingEdit` 内部静默失败了，② 依然会执行，不影响正常同步流程。

---

### 4.7 `app/(main)/_components/Banner.tsx`

Banner 只负责**读取状态、展示 UI、触发用户操作**，不包含任何业务逻辑。

**`showOfflineBanner` 的触发条件**

```ts
const hasPendingForPage = hasPendingPage(initialData._id)
const showOfflineBanner = !isOnline || hasPendingForPage
```

Banner 在两种情况下出现：

1. **断网**（`!isOnline`）：即使没有未同步内容，也提示用户当前网络状态，让他们知道新的编辑会先保存本地
2. **有未同步草稿**（`hasPendingForPage`）：网络可能在线，但有内容还没推送到云端，需要告知用户

**动态文案与图标的状态机**

```tsx
{
  !isOnline ? (
    <WifiOff /> // 断网
  ) : syncStatus === 'syncing' ? (
    <Loader2 className="animate-spin" /> // 同步中
  ) : (
    <CloudOff /> // 有草稿但未同步
  )
}
```

文案也对应多种状态：

| `isOnline` | `hasPendingForPage` | `syncStatus` | 展示文案                                   |
| ---------- | ------------------- | ------------ | ------------------------------------------ |
| false      | false               | -            | Offline · New edits will be saved locally. |
| false      | true                | -            | Offline · Changes saved locally.           |
| true       | true                | `syncing`    | Syncing changes to cloud…                  |
| true       | true                | `failed`     | Sync failed · Changes still saved locally. |
| true       | true                | `idle`       | Changes saved locally · Not yet synced.    |

**"Retry Sync"按钮的显示条件**

```tsx
{
  hasPendingForPage && syncStatus !== 'syncing' && (
    <Button onClick={syncAllPending}>
      <RefreshCw /> Retry Sync
    </Button>
  )
}
```

只有在有草稿、且当前不正在同步时，才显示按钮。同步中时不应该让用户重复触发（虽然 `isSyncing` 互斥锁会保护，但 UI 上也要保持一致）。

---

## 5. 完整数据流：三种场景演练

### 场景一：正常网络下编辑

```
用户编辑内容（500ms 防抖后触发 onContentChange）
  │
  ├─1→ savePendingEdit()      IndexedDB 写入草稿
  ├─2→ addPendingPage()       Zustand: pendingPageIds = ['abc']
  │                            Banner: showOfflineBanner = true（短暂出现）
  ├─3→ Convex.update()        网络请求发送 ✓
  ├─4→ deletePendingEdit()    IndexedDB 草稿删除
  └─5→ removePendingPage()    Zustand: pendingPageIds = []
                               Banner: showOfflineBanner = false（消失）

用户几乎感知不到 Banner，因为 1→5 在正常网络下发生得非常快。
```

### 场景二：断网时编辑，恢复后自动同步

```
网络断开
  └─ window 触发 'offline' 事件
     └─ useOfflineSync: setOnline(false)
        Banner: 显示 WifiOff 图标

用户继续编辑（3次）
  每次编辑：
    ① IndexedDB 写入（覆盖上一次草稿，只保留最新版本）
    ② Convex.update() 失败（catch 静默处理）
  Banner 持续显示 "Offline · Changes saved locally."

网络恢复
  └─ window 触发 'online' 事件
     └─ useOfflineSync: setOnline(true)，触发 syncAllPending()
        Banner: 图标变为 Loader2（旋转），文案变为 "Syncing..."
        Convex.update() 成功
        IndexedDB 草稿删除
        Banner: 消失
        Toast: "All changes have been synced to the cloud."
```

### 场景三：上次会话断网后关闭了标签页

```
新会话打开页面 abc123
  │
  ├─ Convex 查询加载中（page = undefined）
  ├─ IndexedDB 检查开始（localDraftContent = undefined）
  │   └─ 发现有草稿（上次会话未同步的内容）
  │       setLocalDraftContent(draftContent)  ← 使用草稿内容
  │       addPendingPage('abc123')
  │
  ├─ 等待两者都完成
  │
  └─ Editor 初始化，传入 localDraftContent（草稿）而非 page.content（旧云端快照）

同时，OfflineSyncMount 的初始化 useEffect：
  ├─ getAllPendingEdits() 发现有草稿
  ├─ navigator.onLine = true
  └─ 立即触发 syncAllPending()，将草稿同步到 Convex
```

---

## 6. 关键设计决策与权衡

### 6.1 为什么不用 Service Worker？

Service Worker 是更"完整"的离线方案，可以拦截所有网络请求。但它的复杂度也更高：

- 需要单独的 `sw.js` 文件，生命周期管理复杂
- 与 Next.js 的 App Router 集成需要额外配置
- 调试困难
- 对于我们的场景（只需要缓存文档内容），IndexedDB + 事件监听已经足够，引入 Service Worker 是**过度工程**

### 6.2 为什么每次编辑都覆盖而不是追加历史版本？

`savePendingEdit` 使用 `put()` 而不是 `add()`，后者会追加新记录。覆盖的好处：

- IndexedDB 中同一个 `pageId` 永远只有一条记录，不会无限膨胀
- 编辑器的 `onChange` 在 500ms 防抖后传入的是**完整文档快照**，不是增量 diff，只需保留最新版本

如果未来想实现"本地历史版本"功能，可以考虑改为追加模式，并加 timestamp 作为排序依据。

### 6.3 `localDraftContent` 为何区分 `null` 和 `undefined`？

如果只用 `string | undefined`：

```ts
// 问题：undefined 可能表示"还没检查"，也可能表示"检查完了，没有草稿"
// 无法区分这两种情况！
const [draft, setDraft] = useState<string | undefined>(undefined)
```

加入 `null` 作为第三种状态，让状态机语义清晰：

```
undefined → 初始状态，检查还没开始/完成
null      → 检查完了，确认没有草稿
string    → 检查完了，有草稿
```

这样渲染门卫 `localDraftContent === undefined` 才能准确判断"是否还在检查中"。

### 6.4 `OfflineSyncMount` 渲染 `null` 是否有性能问题？

React 渲染 `null` 的成本极低（几乎为零）。这个组件的存在只是为了让 `useOfflineSync()` hook 的生命周期与 `MainLayout` 绑定。渲染 `null` 是这种"纯副作用组件"的标准写法。

---

## 7. 已覆盖的边界情况

| 边界情况                                   | 处理方式                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| IndexedDB 不可用（隐身模式等）             | 所有 IndexedDB 操作都有 try-catch，静默降级为仅尝试 Convex 同步              |
| 多次快速编辑                               | 防抖 500ms + IndexedDB 的 `put()` 覆盖语义，只保留最新版本                   |
| 同时从多个地方触发 syncAllPending          | 模块级 `isSyncing` 互斥锁，保证同一时间只有一次同步执行                      |
| 同步时 Convex 部分成功部分失败             | `Promise.allSettled` + 逐条删除草稿，成功的清理，失败的保留等待重试          |
| 浏览器关闭后重新打开                       | 跨会话草稿恢复：页面加载时检查 IndexedDB，优先使用草稿                       |
| `navigator.onLine` 误报（连着弱网）        | 30 秒轮询兜底，最终确保同步                                                  |
| 服务端渲染时访问 `navigator`               | `typeof navigator !== 'undefined'` 安全检查                                  |
| 上次 `syncAllPending` 还没完成就离开了页面 | 互斥锁 `isSyncing` 在 `finally` 中释放，下次打开会重新同步                   |
| 编辑已归档的页面                           | `editable={!page.isArchived}` 传给 Editor，归档页面只读，不会触发 `onChange` |

---

## 8. 文件依赖关系图

```
app/(main)/layout.tsx
  └── OfflineSyncMount.tsx
       └── use-offline-sync.tsx
            ├── use-network-status.ts  (读/写 Zustand 状态)
            ├── use-sync-trigger.ts    (执行同步)
            │    ├── use-network-status.ts
            │    └── lib/offline-storage.ts
            └── lib/offline-storage.ts

app/(main)/_components/Banner.tsx
  ├── use-network-status.ts  (只读状态，展示 UI)
  └── use-sync-trigger.ts    (手动重试按钮)

app/(main)/(routes)/pages/[pageId]/page.tsx
  ├── use-network-status.ts  (读写 pendingPageIds)
  └── lib/offline-storage.ts (草稿读取、写入、删除)
```

可以看到，`lib/offline-storage.ts` 和 `use-network-status.ts` 是**两个核心依赖**，被多个模块共享。所有模块通过这两个文件交换信息，避免了组件之间的直接耦合。
