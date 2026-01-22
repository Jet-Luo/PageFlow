import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

export const getSidebarPages = query({
  args: {
    parentPage: v.optional(v.id('pages'))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject
    const pages = await ctx.db
      .query('pages')
      .withIndex('by_user_parent', (q) => q.eq('userId', userId).eq('parentPage', args.parentPage))
      .filter((q) => q.eq(q.field('isArchived'), false))
      .order('desc')
      .collect()

    return pages
  }
})

export const getSearchPages = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const UserId = identity.subject
    const pages = await ctx.db
      .query('pages')
      .withIndex('by_user', (q) => q.eq('userId', UserId))
      .filter((q) => q.eq(q.field('isArchived'), false))
      .order('desc')
      .collect()

    return pages
  }
})

// export const getPagesByUser = query({
//   args: {
//     userId: v.string()
//   },
//   handler: async (ctx, args) => {
//     const pages = await ctx.db
//       .query('pages')
//       .withIndex('by_user', (q) => q.eq('userId', args.userId))
//       .collect()
//     return pages
//   }
// })

export const createPage = mutation({
  args: {
    title: v.string(),
    parentPage: v.optional(v.id('pages'))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const page = await ctx.db.insert('pages', {
      title: args.title,
      parentPage: args.parentPage,
      userId,
      isArchived: false,
      isPublished: false
    })

    return page
  }
})

export const archivePage = mutation({
  args: {
    id: v.id('pages')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const existingPage = await ctx.db.get(args.id)
    if (!existingPage) throw new Error('Page not found')
    if (existingPage.userId !== userId) throw new Error('Forbidden')

    // 实现软删除，通过将 isArchived 设置为 true
    // 需求：实现归档时，连同其所有子页面一并归档（递归实现）
    const recursiveArchive = async (pageId: Id<'pages'>) => {
      const childPages = await ctx.db
        .query('pages')
        .withIndex('by_user_parent', (q) => q.eq('userId', userId).eq('parentPage', pageId))
        .collect()

      for (const childPage of childPages) {
        await ctx.db.patch(childPage._id, { isArchived: true })
        await recursiveArchive(childPage._id)
      }
    }

    const archivedPage = await ctx.db.patch(args.id, {
      isArchived: true
    })

    await recursiveArchive(args.id)

    return archivedPage
  }
})

export const getTrashPages = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject
    const pages = await ctx.db
      .query('pages')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('isArchived'), true))
      .order('desc')
      .collect()

    return pages
  }
})

export const restorePage = mutation({
  args: {
    id: v.id('pages')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const existingPage = await ctx.db.get(args.id)
    if (!existingPage) throw new Error('Page not found')
    if (existingPage.userId !== userId) throw new Error('Forbidden')

    // 实现恢复，通过将 isArchived 设置为 false
    // 需求：实现恢复时，连同其所有子页面一并恢复（递归实现）
    const recursiveRestore = async (pageId: Id<'pages'>) => {
      const childPages = await ctx.db
        .query('pages')
        .withIndex('by_user_parent', (q) => q.eq('userId', userId).eq('parentPage', pageId))
        .collect()

      for (const childPage of childPages) {
        await ctx.db.patch(childPage._id, { isArchived: false })
        await recursiveRestore(childPage._id)
      }
    }

    // 需检查：当前页面的父页面是否被归档，如果是，则设置当前页面的父页面为 undefined，即断除与父页面的关联
    // options 用于存储要更新的字段，这里是 isArchived 和可能的 parentPage
    // Partial<Doc<'pages'>> 表示这个对象可以包含 Doc<'pages'> 类型的任意子集，即可以只包含部分字段
    const options: Partial<Doc<'pages'>> = {
      isArchived: false
    }

    const parentPageId = existingPage.parentPage
    if (parentPageId) {
      const parentPage = await ctx.db.get(parentPageId)
      if (parentPage && parentPage.isArchived) {
        options.parentPage = undefined
      }
    }

    // 恢复当前页面
    const restoredPage = await ctx.db.patch(args.id, options)

    await recursiveRestore(args.id)

    return restoredPage
  }
})

export const deletePagePermanently = mutation({
  args: {
    id: v.id('pages')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    const existingPage = await ctx.db.get(args.id)
    if (!existingPage) throw new Error('Page not found')
    if (existingPage.userId !== userId) throw new Error('Forbidden')

    // 实现永久删除
    // 需求一：实现删除时，连同其所有子页面一并删除（递归实现）
    // const recursiveDelete = async (pageId: Id<'pages'>) => {
    //   const childPages = await ctx.db
    //     .query('pages')
    //     .withIndex('by_user_parent', (q) => q.eq('userId', userId).eq('parentPage', pageId))
    //     .collect()
    //
    //   for (const childPage of childPages) {
    //     await recursiveDelete(childPage._id)
    //     await ctx.db.delete(childPage._id)
    //   }
    // }
    //
    // await recursiveDelete(args.id)
    // await ctx.db.delete(args.id)
    //
    // return { success: true }

    // 需求二：只删除当前页面，保留子页面，但将子页面的 parentPage 设为 undefined
    const childPages = await ctx.db
      .query('pages')
      .withIndex('by_user_parent', (q) => q.eq('userId', userId).eq('parentPage', args.id))
      .collect()

    for (const childPage of childPages) {
      await ctx.db.patch(childPage._id, { parentPage: undefined })
    }

    const deletedPage = await ctx.db.delete(args.id)

    return deletedPage
  }
})

export const getPageById = query({
  args: {
    id: v.id('pages')
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    // 因为页面可以是公开的（isPublished），所以不需要一开始就验证身份（后续会根据页面状态再决定是否需要身份验证）
    // if (!identity) throw new Error('Unauthorized')
    //
    // const userId = identity.subject

    const page = await ctx.db.get(args.id)
    if (!page) throw new Error('Page not found')

    if (page.isPublished && !page.isArchived) return page

    if (!identity) throw new Error('Unauthorized')
    const userId = identity.subject
    if (page.userId !== userId) throw new Error('Forbidden')

    return page
  }
})

export const updatePage = mutation({
  args: {
    id: v.id('pages'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const userId = identity.subject

    // 使用解构赋值提取 id，剩余字段组成 updateData 对象
    const { id, ...updateData } = args

    const existingPage = await ctx.db.get(id)
    if (!existingPage) throw new Error('Page not found')
    if (existingPage.userId !== userId) throw new Error('Forbidden')

    const updatedPage = await ctx.db.patch(id, updateData)

    return updatedPage
  }
})
