import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { Id } from './_generated/dataModel'
// import { Doc, Id } from './_generated/dataModel'

export const getPages = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthorized')

    const pages = await ctx.db.query('pages').collect()

    return pages
  }
})

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
